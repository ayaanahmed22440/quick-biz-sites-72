import { createFileRoute } from "@tanstack/react-router";

/**
 * Whop webhook receiver (Standard Webhooks).
 * Verifies the signature over the raw body, ignores duplicate deliveries,
 * logs every event, and is the only thing allowed to grant paid access.
 */
export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WHOP_WEBHOOK_SECRET"];
        if (!secret) return new Response("Billing webhook not configured", { status: 503 });

        const body = await request.text();
        const id = request.headers.get("webhook-id") ?? "";
        const timestamp = request.headers.get("webhook-timestamp") ?? "";
        const signature = request.headers.get("webhook-signature") ?? "";

        const { verifyWhopSignature, timestampIsFresh } = await import("@/lib/whop.server");

        if (!id || !timestamp || !signature) return new Response("Missing signature", { status: 401 });
        if (!timestampIsFresh(timestamp)) return new Response("Stale timestamp", { status: 401 });
        if (!verifyWhopSignature({ secret, id, timestamp, signatureHeader: signature, body })) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: { type?: string; action?: string; data?: Record<string, unknown> };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventType = payload.type ?? payload.action ?? "unknown";
        const data = (payload.data ?? {}) as Record<string, unknown>;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: the unique (provider, event_id) index rejects replays.
        const { error: claimError } = await supabaseAdmin.from("billing_events").insert({
          provider: "whop",
          event_id: id,
          event_type: eventType,
          payload: payload as never,
        });
        if (claimError) {
          if (claimError.code === "23505") return Response.json({ ok: true, duplicate: true });
          console.error("[whop-webhook] could not record event", claimError.message);
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
            .eq("provider", "whop")
            .eq("event_id", id);
        };

        try {
          const { syncMembership, syncMembershipById, markPaymentFailed, resolveMembershipOwner } =
            await import("@/lib/whop-sync.server");

          // Whop's current membership events: activated, deactivated,
          // cancel_at_period_end_changed, trial_ending_soon, plus legacy went_valid/went_invalid.
          if (eventType.startsWith("membership.")) {
            const ends =
              eventType.endsWith("deactivated") ||
              eventType.endsWith("went_invalid") ||
              eventType.endsWith("expired");
            const starts = eventType.endsWith("activated") || eventType.endsWith("went_valid");
            const options = ends
              ? ({ forceStatus: "canceled" } as const)
              : starts
                ? ({ forceStatus: "active" } as const)
                : undefined;
            const businessId = await syncMembership(data as never, options);
            await finish(businessId ? "processed" : "unmatched", businessId);
            return Response.json({ ok: true, matched: Boolean(businessId) });
          }

          if (eventType === "payment.succeeded" || eventType === "payment.authorized") {
            const membershipId =
              (typeof data["membership"] === "string" ? data["membership"] : null) ??
              (typeof data["membership_id"] === "string" ? data["membership_id"] : null);
            const businessId = membershipId
              ? await syncMembershipById(membershipId, { forceStatus: "active" })
              : null;
            await finish(businessId ? "processed" : "unmatched", businessId);
            return Response.json({ ok: true, matched: Boolean(businessId) });
          }

          if (eventType === "payment.failed") {
            const owner = await resolveMembershipOwner({
              id: (typeof data["membership"] === "string" ? data["membership"] : "") || "",
              metadata: (data["metadata"] as Record<string, unknown> | undefined) ?? null,
            });
            if (owner) await markPaymentFailed(owner.businessId);
            await finish(owner ? "processed" : "unmatched", owner?.businessId ?? null);
            return Response.json({ ok: true, matched: Boolean(owner) });
          }

          await finish("ignored", null);
          return Response.json({ ok: true, ignored: eventType });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("[whop-webhook] processing failed", message);
          await finish("error", null, message);
          return new Response("Processing error", { status: 500 });
        }
      },
    },
  },
});
