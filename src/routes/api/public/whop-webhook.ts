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
 */

const payloadSchema = z.object({
  action: z.string().min(1).max(120),
  data: z.object({
    id: z.string().min(1).max(120),
    status: z.string().min(1).max(60).optional(),
    valid: z.boolean().optional(),
    plan_id: z.string().min(1).max(120).optional(),
    renewal_period_end: z.union([z.number(), z.string()]).nullable().optional(),
    cancel_at_period_end: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
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

function verify(signature: string | null, body: string, secret: string) {
  if (!signature) return false;
  const provided = signature.replace(/^sha256=/, "").trim();
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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

        const { action, data } = parsed.data;
        const businessId = data.metadata?.["business_id"];
        if (typeof businessId !== "string") {
          // Nothing to attach the membership to; acknowledge so Whop stops retrying.
          return Response.json({ ok: true, ignored: "missing business_id" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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
            : (STATUS_MAP[rawStatus] ?? "incomplete");

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan_id")
          .eq("business_id", businessId)
          .maybeSingle();

        const planId = plan?.id ?? existing?.plan_id;
        if (!planId) {
          return Response.json({ ok: true, ignored: "unknown plan" });
        }

        const row = {
          business_id: businessId,
          plan_id: planId,
          provider: "whop",
          status: status as "active",
          whop_membership_id: data.id,
          whop_plan_id: data.plan_id ?? null,
          current_period_end: toIso(data.renewal_period_end ?? null),
          cancel_at_period_end: data.cancel_at_period_end ?? false,
        };

        const { error } = existing
          ? await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id)
          : await supabaseAdmin.from("subscriptions").insert(row);

        if (error) {
          console.error("whop webhook write failed", error.message);
          return new Response("Write failed", { status: 500 });
        }

        await supabaseAdmin.from("activity_logs").insert({
          business_id: businessId,
          action: `billing.${action}`,
          entity_type: "subscription",
          entity_id: data.id,
        });

        return Response.json({ ok: true });
      },
    },
  },
});
