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
 * The business is resolved from checkout-session metadata, then existing
 * membership data, with buyer email retained only as a legacy fallback.
 */

const payloadSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.enum([
    "payment.succeeded",
    "payment.failed",
    "membership.activated",
    "membership.deactivated",
    "membership.cancel_at_period_end_changed",
  ]),
  timestamp: z.string().datetime().optional(),
  data: z
    .object({
      id: z.string().min(1).max(120).optional(),
      status: z.string().min(1).max(60).optional(),
      valid: z.boolean().optional(),
      plan_id: z.string().min(1).max(120).nullable().optional(),
      plan: z.union([z.string(), z.object({ id: z.string().optional() })]).nullable().optional(),
      membership: z.union([z.string(), z.object({ id: z.string().optional() })]).nullable().optional(),
      member: z.object({ id: z.string().optional(), email: z.string().max(320).nullable().optional() }).nullable().optional(),
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

/** Verify Whop Standard Webhooks against the untouched request body. */
function verify(webhookId: string | null, timestamp: string | null, signature: string | null, body: string, secret: string) {
  if (!webhookId || !timestamp || !signature) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${webhookId}.${timestamp}.${body}`)
    .digest("base64");
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",", 2);
    return version === "v1" && Boolean(value) && safeEqual(value, expected);
  });
}

function resourceId(value: { id?: string | undefined } | string | null | undefined) {
  return typeof value === "string" ? value : value?.id;
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
        const webhookId = request.headers.get("webhook-id");
        const timestamp = request.headers.get("webhook-timestamp");
        const signature = request.headers.get("webhook-signature");
        if (!verify(webhookId, timestamp, signature, body, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }
        if (!webhookId) return new Response("Invalid signature", { status: 401 });

        let json: unknown;
        try {
          json = JSON.parse(body);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }
        const parsed = payloadSchema.safeParse(json);
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }

        const { data } = parsed.data;
        const action = parsed.data.type;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: claimed } = await supabaseAdmin
          .from("billing_webhook_events")
          .insert({ webhook_id: webhookId, event_type: action, payload_created_at: parsed.data.timestamp ?? null })
          .select("webhook_id")
          .maybeSingle();
        if (!claimed) return Response.json({ ok: true, duplicate: true });

        /** Keep an audit trail of every verified event so billing is debuggable. */
        const log = (note: string, businessId: string | null) =>
          supabaseAdmin.from("activity_logs").insert({
            business_id: businessId,
            action: `whop:${action}`,
            meta: {
              note,
              membership_id: resourceId(data.membership) ?? (action.startsWith("membership.") ? data.id : null),
              whop_plan_id: data.plan_id ?? resourceId(data.plan) ?? null,
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
        const membershipId = resourceId(data.membership) ?? (action.startsWith("membership.") ? data.id : null) ?? null;
        if (!businessId && membershipId) {
          const { data: byMembership } = await supabaseAdmin
            .from("subscriptions")
            .select("business_id")
            .eq("whop_membership_id", membershipId)
            .maybeSingle();
          businessId = byMembership?.business_id ?? null;
        }

        // 3) fall back to the buyer's email address
        const email = (data.email ?? data.user_email ?? data.user?.email ?? data.member?.email ?? "").trim().toLowerCase();
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
          await supabaseAdmin.from("billing_webhook_events").update({ note: "no business match" }).eq("webhook_id", webhookId);
          return Response.json({ ok: true, ignored: "no business match" });
        }

        const metadataPlanId = typeof data.metadata?.["plan_id"] === "string" ? data.metadata["plan_id"] : null;
        const externalPlanId = data.plan_id ?? resourceId(data.plan);
        const { data: plan } = externalPlanId
          ? await supabaseAdmin
              .from("plans")
              .select("id")
              .eq("whop_plan_id", externalPlanId)
              .maybeSingle()
          : { data: null };

        const rawStatus = data.status ?? (data.valid ? "active" : "canceled");
        const status = action === "membership.deactivated"
          ? "canceled"
          : action === "payment.failed"
            ? "past_due"
            : (STATUS_MAP[rawStatus] ?? "active");

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan_id")
          .eq("business_id", businessId)
          .maybeSingle();

        const planId = metadataPlanId ?? plan?.id ?? existing?.plan_id;
        if (!planId) {
          await log(`unknown whop plan ${externalPlanId ?? "(none)"}`, businessId);
          return Response.json({ ok: true, ignored: "unknown plan" });
        }

        const row = {
          business_id: businessId,
          plan_id: planId,
          provider: "whop",
          status: status as "active",
          whop_membership_id: membershipId,
          whop_plan_id: externalPlanId ?? null,
          current_period_end: toIso(data.renewal_period_end ?? null),
          cancel_at_period_end:
            action === "membership.cancel_at_period_end_changed"
              ? (data.cancel_at_period_end ?? true)
              : (data.cancel_at_period_end ?? false),
          last_payment_failed_at: action === "payment.failed" ? new Date().toISOString() : null,
        };

        const { error } = existing
          ? await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id)
          : await supabaseAdmin.from("subscriptions").insert(row);

        if (error) {
          await log(`write failed: ${error.message}`, businessId);
          return new Response("Write failed", { status: 500 });
        }

        await log(`subscription ${existing ? "updated" : "created"} as ${planId}/${status}`, businessId);
        await supabaseAdmin
          .from("billing_webhook_events")
          .update({ processed: true, business_id: businessId, note: `${planId}/${status}` })
          .eq("webhook_id", webhookId);

        return Response.json({ ok: true });
      },
    },
  },
});
