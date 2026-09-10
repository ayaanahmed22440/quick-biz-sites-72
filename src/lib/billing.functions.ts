import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startCheckoutInput = z.object({
  planId: z.string().min(2).max(40),
  returnPath: z.string().max(200).optional(),
  /** Which business is being paid for. Defaults to the caller's first business. */
  businessId: z.string().uuid().optional(),
});

function safeReturnPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

/**
 * Creates a Polar checkout for the caller's business.
 * The Polar access token stays on the server; the browser only receives a URL.
 */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => startCheckoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS keeps this scoped to businesses the caller belongs to, so an explicit
    // id can be trusted once the row comes back.
    let query = supabase.from("businesses").select("id, name, email");
    query = data.businessId
      ? query.eq("id", data.businessId)
      : query.order("created_at", { ascending: true }).limit(1);
    const { data: business, error: businessError } = await query.maybeSingle();
    if (businessError) throw new Error(businessError.message);
    if (!business) throw new Error("Add your business details before choosing a plan.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id, polar_product_id, is_active")
      .eq("id", data.planId)
      .maybeSingle();
    if (!plan?.polar_product_id || !plan.is_active) {
      throw new Error("That plan is not available right now.");
    }

    const returnPath = safeReturnPath(data.returnPath);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("checkout_sessions")
      .insert({
        business_id: business.id,
        user_id: userId,
        plan_id: plan.id,
        return_path: returnPath,
      })
      .select("id")
      .single();
    if (sessionError) throw new Error(sessionError.message);

    const appUrl = process.env["APP_URL"] ?? "https://webwarheads.com";
    const { createPolarCheckout } = await import("./polar.server");

    try {
      const checkout = await createPolarCheckout({
        productId: plan.polar_product_id,
        externalCustomerId: business.id,
        customerEmail: business.email,
        metadata: {
          checkout_session_id: session.id,
          business_id: business.id,
          plan_id: plan.id,
          user_id: userId,
        },
        successUrl: `${appUrl}/billing/return?session=${session.id}`,
      });

      await supabaseAdmin
        .from("checkout_sessions")
        .update({ checkout_url: checkout.url, polar_checkout_id: checkout.id })
        .eq("id", session.id);

      return { url: checkout.url, sessionId: session.id };
    } catch (error) {
      await supabaseAdmin
        .from("checkout_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);
      throw error instanceof Error ? error : new Error("Could not start checkout.");
    }
  });

/**
 * Backend truth for "has the payment landed yet".
 * Never trusts the redirect: it reads the subscription written by the verified webhook.
 */
export const checkSubscriptionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: business } = await context.supabase
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!business) return { active: false, status: null as string | null, planId: null as string | null };

    const { data: subscription } = await context.supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("business_id", business.id)
      .maybeSingle();

    const active = ["active", "trialing", "past_due"].includes(subscription?.status ?? "");
    return {
      active,
      status: subscription?.status ?? null,
      planId: subscription?.plan_id ?? null,
    };
  });

const sessionInput = z.object({ sessionId: z.string().uuid() });

/** Where to send the customer back to after checkout, read from the stored session. */
export const getCheckoutReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sessionInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: session } = await context.supabase
      .from("checkout_sessions")
      .select("return_path, plan_id, status")
      .eq("id", data.sessionId)
      .maybeSingle();
    return {
      returnPath: safeReturnPath(session?.return_path ?? undefined),
      planId: session?.plan_id ?? null,
    };
  });
