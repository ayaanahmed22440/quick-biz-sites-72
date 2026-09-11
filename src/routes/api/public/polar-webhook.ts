import { createFileRoute } from "@tanstack/react-router";

/**
 * Polar webhook receiver (Standard Webhooks).
 * Verifies the signature over the raw body, ignores duplicate deliveries,
 * logs every event, and is the only thing allowed to grant paid access.
 */
export const Route = createFileRoute("/api/public/polar-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["POLAR_WEBHOOK_SECRET"];
        if (!secret) return new Response("Billing webhook not configured", { status: 503 });

        const body = await request.text();
        const id = request.headers.get("webhook-id") ?? "";
        const timestamp = request.headers.get("webhook-timestamp") ?? "";
        const signature = request.headers.get("webhook-signature") ?? "";

        const { verifyPolarSignature, timestampIsFresh } = await import("@/lib/polar.server");

        if (!id || !timestamp || !signature) return new Response("Missing signature", { status: 401 });
        if (!timestampIsFresh(timestamp)) return new Response("Stale timestamp", { status: 401 });
        if (!verifyPolarSignature({ secret, id, timestamp, signatureHeader: signature, body })) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: { type?: string; data?: Record<string, unknown> };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventType = payload.type ?? "unknown";
        const data = (payload.data ?? {}) as Record<string, unknown>;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: the unique (provider, event_id) index rejects replays.
        const { error: claimError } = await supabaseAdmin.from("billing_events").insert({
          provider: "polar",
          event_id: id,
          event_type: eventType,
          payload: payload as never,
        });
        if (claimError) {
          if (claimError.code === "23505") return Response.json({ ok: true, duplicate: true });
          console.error("[polar-webhook] could not record event", claimError.message);
          return new Response("Storage error", { status: 500 });
        }

        const finish = async (status: string, businessId: string | null, error?: string) => {
          await supabaseAdmin
            .from("billing_events")
            .update({
              status,
              business_id: businessId,
              error: error ?? null,
              processed_at: new Date().toISOString(),
            })
            .eq("provider", "polar")
            .eq("event_id", id);
        };

        try {
          const { syncSubscription, syncSubscriptionById, markPaymentFailed, resolveSubscriptionOwner } =
            await import("@/lib/polar-sync.server");
          const { recordPaymentFailure, clearPaymentFailures } = await import(
            "@/lib/checkout-guard.server"
          );
          const sub = data as never;

          if (eventType.startsWith("subscription.")) {
            const forceStatus =
              eventType === "subscription.active" || eventType === "subscription.uncanceled"
                ? ("active" as const)
                : eventType === "subscription.revoked"
                  ? ("expired" as const)
                  : eventType === "subscription.past_due"
                    ? ("past_due" as const)
                    : undefined;
            const businessId = await syncSubscription(
              sub,
              forceStatus ? { forceStatus } : undefined,
            );
            // A failed renewal must also stamp the failure and email the customer.
            if (businessId && forceStatus === "past_due") {
              await markPaymentFailed(businessId);
              await recordPaymentFailure(businessId);
            }
            // A good payment clears any card-testing cooldown.
            if (businessId && forceStatus === "active") await clearPaymentFailures(businessId);
            await finish(businessId ? "processed" : "unmatched", businessId);
            return Response.json({ ok: true, matched: Boolean(businessId) });
          }

          if (eventType === "order.paid" || eventType === "order.created") {
            const subscriptionId =
              typeof data["subscription_id"] === "string"
                ? data["subscription_id"]
                : typeof (data["subscription"] as { id?: string } | undefined)?.id === "string"
                  ? (data["subscription"] as { id: string }).id
                  : null;
            const businessId = subscriptionId
              ? await syncSubscriptionById(subscriptionId, { forceStatus: "active" })
              : null;
            if (businessId) await clearPaymentFailures(businessId);
            await finish(businessId ? "processed" : "unmatched", businessId);
            return Response.json({ ok: true, matched: Boolean(businessId) });
          }

          if (eventType === "order.refunded" || eventType === "checkout.updated") {
            await finish("ignored", null);
            return Response.json({ ok: true, ignored: eventType });
          }

          if (eventType === "subscription.past_due" || eventType === "order.payment_failed") {
            const owner = await resolveSubscriptionOwner(sub);
            if (owner) {
              await markPaymentFailed(owner.businessId);
              await recordPaymentFailure(owner.businessId);
            }
            await finish(owner ? "processed" : "unmatched", owner?.businessId ?? null);
            return Response.json({ ok: true, matched: Boolean(owner) });
          }

          await finish("ignored", null);
          return Response.json({ ok: true, ignored: eventType });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("[polar-webhook] processing failed", message);
          await finish("error", null, message);
          return new Response("Processing error", { status: 500 });
        }
      },
    },
  },
});
