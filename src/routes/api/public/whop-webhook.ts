import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

/**
 * Whop billing webhook.
 *
 * Whop is the source of truth for subscription state. This endpoint verifies the
 * signature, then mirrors the membership into `subscriptions`, which is what the
 * centralized entitlements in `src/lib/plans.ts` read. No payment state is ever
 * set from the browser.
 *
 * The business is resolved from `metadata[business_id]` when the checkout link
 * carried it, and otherwise from the buyer's email address, so a plain Whop
 * checkout link still activates the right account.
 */

const payloadSchema = z.object({
  action: z.string().min(1).max(120).optional(),
  event: z.string().min(1).max(120).optional(),
  data: z
    .object({
      id: z.string().min(1).max(120).optional(),
      status: z.string().min(1).max(60).optional(),
      valid: z.boolean().optional(),
      plan_id: z.string().min(1).max(120).optional(),
      renewal_period_end: z.union([z.number(), z.string()]).nullable().optional(),
      cancel_at_period_end: z.boolean().optional(),
      metadata: z.record(z.string(), z.unknown()).nullable().optional(),
      email: z.string().max(320).nullable().optional(),
      user_email: z.string().max(320).nullable().optional(),
      user: z
        .object({ email: z.string().max(320).nullable().optional() })
        .nullable()
        .optional(),
    })
    .passthrough(),
});

const STATUS_MAP: Record<string, string> = {
  active: "active",
  trialing: "trialing",
  completed: "active",
  past_due: "past_due",
  unresolved: "past_due",
  canceled: "canceled",
  cancelled: "canceled",
  expired: "expired",
  incomplete: "incomplete",
};

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Whop has shipped a few signature formats over time:
 *   - a bare hex HMAC of the raw body (optionally `sha256=` prefixed)
 *   - a Stripe/Svix-style header `t=<unix>,v1=<hmac>` signed over `<t>.<body>`
 * Accept any of them, in hex or base64, so a working webhook doesn't depend on
 * which format the dashboard is using.
 */
function verify(signature: string | null, body: string, secret: string) {
  if (!signature) return false;

  const provided: string[] = [];
  let timestamp: string | null = null;

  for (const part of signature.split(/[,\s]+/)) {
    const chunk = part.trim();
    if (!chunk) continue;
    const eq = chunk.indexOf("=");
    const key = eq > -1 ? chunk.slice(0, eq) : "";
    const value = eq > -1 ? chunk.slice(eq + 1) : chunk;
    if (key === "t") timestamp = value;
    else if (!key || key === "v1" || key === "v0" || key === "sha256") provided.push(value);
    else provided.push(value);
  }

  const payloads = [body];
  if (timestamp) payloads.push(`${timestamp}.${body}`);

  for (const payload of payloads) {
    const mac = createHmac("sha256", secret).update(payload);
    const hex = mac.digest("hex");
    const base64 = Buffer.from(hex, "hex").toString("base64");
    for (const candidate of provided) {
      if (safeEqual(candidate, hex) || safeEqual(candidate, base64)) return true;
    }
  }
  return false;
}

function toIso(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WHOP_WEBHOOK_SECRET"];
        if (!secret) {
          return new Response("Billing webhook not configured", { status: 503 });
        }

        const body = await request.text();
        const signature =
          request.headers.get("x-whop-signature") ?? request.headers.get("whop-signature");
        if (!verify(signature, body, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const parsed = payloadSchema.safeParse(JSON.parse(body));
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }

        const { data } = parsed.data;
        const action = parsed.data.action ?? parsed.data.event ?? "unknown";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        /** Keep an audit trail of every verified event so billing is debuggable. */
        const log = (note: string, businessId: string | null) =>
          supabaseAdmin.from("activity_logs").insert({
            business_id: businessId,
            action: `whop:${action}`,
            meta: {
              note,
              membership_id: data.id ?? null,
              whop_plan_id: data.plan_id ?? null,
              status: data.status ?? null,
              valid: data.valid ?? null,
            },
          });

        // 1) business_id passed through checkout metadata
        let businessId =
          typeof data.metadata?.["business_id"] === "string"
            ? (data.metadata["business_id"] as string)
            : null;

        // 2) existing subscription for this membership
        if (!businessId && data.id) {
          const { data: byMembership } = await supabaseAdmin
            .from("subscriptions")
            .select("business_id")
            .eq("whop_membership_id", data.id)
            .maybeSingle();
          businessId = byMembership?.business_id ?? null;
        }

        // 3) fall back to the buyer's email address
        const email = (data.email ?? data.user_email ?? data.user?.email ?? "").trim().toLowerCase();
        if (!businessId && email) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .ilike("email", email)
            .maybeSingle();
          if (profile) {
            const { data: business } = await supabaseAdmin
              .from("businesses")
              .select("id")
              .eq("owner_id", profile.id)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
            businessId = business?.id ?? null;
          }
        }

        if (!businessId) {
          await log("could not match a business (no metadata, membership or email match)", null);
          return Response.json({ ok: true, ignored: "no business match" });
        }

        const { data: plan } = data.plan_id
          ? await supabaseAdmin
              .from("plans")
              .select("id")
              .eq("whop_plan_id", data.plan_id)
              .maybeSingle()
          : { data: null };

        const rawStatus = data.status ?? (data.valid ? "active" : "canceled");
        const status =
          action.includes("invalid") || action.includes("cancel")
            ? (STATUS_MAP[rawStatus] ?? "canceled")
            : (STATUS_MAP[rawStatus] ?? "active");

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan_id")
          .eq("business_id", businessId)
          .maybeSingle();

        const planId = plan?.id ?? existing?.plan_id;
        if (!planId) {
          await log(`unknown whop plan ${data.plan_id ?? "(none)"}`, businessId);
          return Response.json({ ok: true, ignored: "unknown plan" });
        }

        const row = {
          business_id: businessId,
          plan_id: planId,
          provider: "whop",
          status: status as "active",
          whop_membership_id: data.id ?? null,
          whop_plan_id: data.plan_id ?? null,
          current_period_end: toIso(data.renewal_period_end ?? null),
          cancel_at_period_end: data.cancel_at_period_end ?? false,
        };

        const { error } = existing
          ? await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id)
          : await supabaseAdmin.from("subscriptions").insert(row);

        if (error) {
          await log(`write failed: ${error.message}`, businessId);
          return new Response("Write failed", { status: 500 });
        }

        await log(`subscription ${existing ? "updated" : "created"} as ${planId}/${status}`, businessId);

        return Response.json({ ok: true });
      },
    },
  },
});
