import { createFileRoute } from "@tanstack/react-router";

/**
 * Pay-now link on a team-built demo site.
 *
 * Public on purpose: the prospect has no account yet. It only ever mints a
 * Polar checkout for the plan staff chose for that specific demo — no data is
 * returned and nothing is granted here. Access is granted solely by the signed
 * Polar webhook.
 */
export const Route = createFileRoute("/api/public/manual-checkout/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const siteUrl = process.env["APP_URL"] ?? "https://www.webwarheads.com";
        const fail = (message: string) =>
          new Response(message, { status: 400, headers: { "Content-Type": "text/plain" } });

        if (!/^[0-9a-f-]{36}$/i.test(params.id)) return fail("Unknown payment link.");

        const { enforceRateLimit, callerKey, RateLimitError } = await import(
          "@/lib/rate-limit.server"
        );
        try {
          await enforceRateLimit({
            bucket: "manual-checkout",
            subject: callerKey(),
            limit: 12,
            windowSeconds: 600,
          });
        } catch (error) {
          if (error instanceof RateLimitError) return fail(error.message);
          throw error;
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: manual } = await supabaseAdmin
          .from("manual_sites")
          .select("id, business_id, owner_user_id, plan_id, status, expires_at, contact_email")
          .eq("id", params.id)
          .maybeSingle();
        if (!manual || manual.status === "cancelled") return fail("This payment link is no longer active.");

        const { data: business } = await supabaseAdmin
          .from("businesses")
          .select("id, name, slug")
          .eq("id", manual.business_id)
          .maybeSingle();
        if (!business) return fail("This payment link is no longer active.");

        if (manual.status === "paid") {
          return Response.redirect(`${siteUrl}/${business.slug}`, 302);
        }

        const { data: plan } = await supabaseAdmin
          .from("plans")
          .select("id, polar_product_id, is_active")
          .eq("id", manual.plan_id)
          .maybeSingle();
        if (!plan?.polar_product_id || !plan.is_active) return fail("This plan is unavailable.");

        const returnPath = `/${business.slug}`;

        // Reuse a fresh, unused link instead of minting one per click.
        const since = new Date(Date.now() - 30 * 60_000).toISOString();
        const { data: existing } = await supabaseAdmin
          .from("checkout_sessions")
          .select("checkout_url")
          .eq("business_id", business.id)
          .eq("plan_id", plan.id)
          .eq("status", "pending")
          .gte("created_at", since)
          .not("checkout_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing?.checkout_url) return Response.redirect(existing.checkout_url, 302);

        const { data: session, error: sessionError } = await supabaseAdmin
          .from("checkout_sessions")
          .insert({
            business_id: business.id,
            user_id: manual.owner_user_id,
            plan_id: plan.id,
            return_path: returnPath,
          })
          .select("id")
          .single();
        if (sessionError) {
          console.error("[manual-checkout] session insert failed", sessionError.message, request.url);
          return fail("We couldn't start the payment. Please try again.");
        }

        try {
          const { createPolarCheckout } = await import("@/lib/polar.server");
          const checkout = await createPolarCheckout({
            productId: plan.polar_product_id,
            externalCustomerId: business.id,
            customerEmail: manual.contact_email,
            metadata: {
              checkout_session_id: session.id,
              business_id: business.id,
              plan_id: plan.id,
              manual_site_id: manual.id,
            },
            successUrl: `${siteUrl}/${business.slug}?paid=1`,
          });
          await supabaseAdmin
            .from("checkout_sessions")
            .update({ checkout_url: checkout.url, polar_checkout_id: checkout.id })
            .eq("id", session.id);
          return Response.redirect(checkout.url, 302);
        } catch (error) {
          await supabaseAdmin
            .from("checkout_sessions")
            .update({ status: "failed" })
            .eq("id", session.id);
          console.error("[manual-checkout] polar failed", error);
          return fail("We couldn't start the payment. Please try again.");
        }
      },
    },
  },
});
