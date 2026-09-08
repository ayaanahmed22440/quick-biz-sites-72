import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const planIdSchema = z.enum([
  "basic",
  "seo",
  "premium",
  "basic_yearly",
  "seo_yearly",
  "premium_yearly",
]);

const createCheckoutSchema = z.object({
  planId: planIdSchema,
  returnUrl: z.string().url().max(500),
});

const confirmCheckoutSchema = z.object({
  receiptId: z.string().min(3).max(160),
});

type WhopCheckoutConfiguration = { id?: string };
type WhopPayment = {
  id?: string;
  status?: string;
  metadata?: Record<string, unknown> | null;
  membership?: { id?: string } | string | null;
  member?: { id?: string } | null;
  plan?: { id?: string } | string | null;
  plan_id?: string | null;
  renewal_period_end?: string | number | null;
};

function bearer(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

function nestedId(value: { id?: string } | string | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}

export const createWhopCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createCheckoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["WHOP_API_KEY"];
    if (!apiKey) throw new Error("Checkout is not configured.");

    const [{ data: business }, { data: plan }, { data: userData }] = await Promise.all([
      context.supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("plans")
        .select("id, whop_plan_id")
        .eq("id", data.planId)
        .eq("is_active", true)
        .maybeSingle(),
      context.supabase.auth.getUser(),
    ]);

    const email = userData.user?.email?.trim().toLowerCase();
    if (!business || !plan?.whop_plan_id || !email) {
      throw new Error("Your account is not ready for checkout.");
    }

    const response = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
      method: "POST",
      headers: bearer(apiKey),
      body: JSON.stringify({
        mode: "payment",
        plan_id: plan.whop_plan_id,
        redirect_url: data.returnUrl,
        metadata: {
          business_id: business.id,
          user_id: context.userId,
          plan_id: plan.id,
          customer_email: email,
        },
      }),
    });

    const json = (await response.json()) as WhopCheckoutConfiguration & {
      error?: { message?: string };
    };
    if (!response.ok || !json.id) {
      throw new Error(json.error?.message ?? "Whop could not start checkout.");
    }

    return { sessionId: json.id, email };
  });

export const confirmWhopCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => confirmCheckoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["WHOP_API_KEY"];
    if (!apiKey) return { confirmed: false as const };

    const response = await fetch(`https://api.whop.com/api/v1/payments/${encodeURIComponent(data.receiptId)}`, {
      headers: bearer(apiKey),
    });
    if (!response.ok) return { confirmed: false as const };

    const payment = (await response.json()) as WhopPayment;
    const metadata = payment.metadata ?? {};
    if (payment.status !== "succeeded" || metadata["user_id"] !== context.userId) {
      return { confirmed: false as const };
    }

    const businessId = typeof metadata["business_id"] === "string" ? metadata["business_id"] : null;
    const planId = typeof metadata["plan_id"] === "string" ? metadata["plan_id"] : null;
    if (!businessId || !planId) return { confirmed: false as const };

    const { data: ownedBusiness } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!ownedBusiness) return { confirmed: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const whopPlanId = payment.plan_id ?? nestedId(payment.plan) ?? null;
    const whopMembershipId = nestedId(payment.membership) ?? payment.member?.id ?? null;
    const periodEnd = payment.renewal_period_end
      ? new Date(
          typeof payment.renewal_period_end === "number"
            ? payment.renewal_period_end * 1000
            : payment.renewal_period_end,
        ).toISOString()
      : null;

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        business_id: businessId,
        plan_id: planId,
        provider: "whop",
        status: "active",
        whop_membership_id: whopMembershipId,
        whop_plan_id: whopPlanId,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        last_payment_failed_at: null,
      },
      { onConflict: "business_id" },
    );
    if (error) throw new Error("Payment succeeded, but the plan could not be updated yet.");

    await supabaseAdmin.from("activity_logs").insert({
      business_id: businessId,
      action: "whop:checkout_confirmed",
      meta: { payment_id: payment.id ?? data.receiptId, plan_id: planId },
    });

    return { confirmed: true as const };
  });