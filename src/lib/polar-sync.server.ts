/** Server-only: writes verified Polar subscription state into our subscriptions table. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { mapPolarStatus, toIso, type PolarSubscription } from "./polar.server";

type Resolved = { businessId: string; planId: string } | null;

/** Finds our business + internal plan for a Polar subscription, without trusting the browser. */
export async function resolveSubscriptionOwner(sub: PolarSubscription): Promise<Resolved> {
  const meta = (sub.metadata ?? {}) as Record<string, unknown>;
  const sessionId = typeof meta["checkout_session_id"] === "string" ? meta["checkout_session_id"] : null;
  const metaBusiness = typeof meta["business_id"] === "string" ? meta["business_id"] : null;
  const metaPlan = typeof meta["plan_id"] === "string" ? meta["plan_id"] : null;
  const productId = sub.product_id ?? sub.product?.id ?? null;

  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("checkout_sessions")
      .select("business_id, plan_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (data) return { businessId: data.business_id, planId: data.plan_id };
  }

  if (metaBusiness && metaPlan) return { businessId: metaBusiness, planId: metaPlan };

  // Already-known subscription (renewals, cancellations).
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("business_id, plan_id")
    .eq("polar_subscription_id", sub.id)
    .maybeSingle();
  if (existing) return { businessId: existing.business_id, planId: existing.plan_id };

  // The business id we send Polar as the external customer id.
  const externalId = sub.customer?.external_id ?? null;
  if (externalId && productId) {
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("polar_product_id", productId)
      .maybeSingle();
    if (plan) return { businessId: externalId, planId: plan.id };
  }

  // Last resort: newest pending checkout for that product.
  if (productId) {
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("polar_product_id", productId)
      .maybeSingle();
    if (plan) {
      const { data: session } = await supabaseAdmin
        .from("checkout_sessions")
        .select("business_id")
        .eq("plan_id", plan.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (session) return { businessId: session.business_id, planId: plan.id };
    }
  }

  return null;
}

/** Emails the owner (and the team) about a billing outcome. Never throws. */
async function notifyBilling(
  businessId: string,
  outcome: "received" | "failed" | "ended",
  planId?: string,
) {
  try {
    const [{ data: business }, { data: plan }] = await Promise.all([
      supabaseAdmin.from("businesses").select("id, name, email").eq("id", businessId).maybeSingle(),
      planId
        ? supabaseAdmin.from("plans").select("name").eq("id", planId).maybeSingle()
        : Promise.resolve({ data: null as { name: string } | null }),
    ]);
    if (!business) return;
    const planName = plan?.name ?? planId ?? "your plan";
    const emails = await import("@/lib/emails.server");

    if (business.email) {
      if (outcome === "received") {
        await emails.sendPaymentReceivedEmail({ to: business.email, businessId, planName });
      } else if (outcome === "failed") {
        await emails.sendPaymentFailedEmail({ to: business.email, businessId });
      } else {
        await emails.sendAccessPausedEmail({ to: business.email, businessId });
      }
    }
    await emails.adminPaymentEvent({ businessId, businessName: business.name, outcome, planName });
  } catch (error) {
    console.error("[billing email] failed", error);
  }
}

/** Upserts the subscription row for a Polar subscription. Returns the business it belongs to. */
export async function syncSubscription(
  sub: PolarSubscription,
  options?: { forceStatus?: "active" | "canceled" | "past_due" | "expired" },
): Promise<string | null> {
  const owner = await resolveSubscriptionOwner(sub);
  if (!owner) return null;

  const status = options?.forceStatus ?? mapPolarStatus(sub.status);

  // Only email when the state actually changes, so renewals don't spam.
  const { data: before } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("business_id", owner.businessId)
    .maybeSingle();
  const previous = before?.status ?? null;

  const row = {
    business_id: owner.businessId,
    plan_id: owner.planId,
    provider: "polar",
    status,
    polar_subscription_id: sub.id,
    polar_customer_id: sub.customer_id ?? sub.customer?.id ?? null,
    current_period_start: toIso(sub.current_period_start),
    current_period_end: toIso(sub.current_period_end),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    canceled_at: toIso(sub.canceled_at) ?? (status === "canceled" ? new Date().toISOString() : null),
  };

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(row, { onConflict: "business_id" });
  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from("checkout_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("business_id", owner.businessId)
    .eq("status", "pending");

  const ended = status === "canceled" || status === "expired";
  if (status === "active" && previous !== "active") {
    await notifyBilling(owner.businessId, "received", owner.planId);
  } else if (ended && previous !== status) {
    await notifyBilling(owner.businessId, "ended", owner.planId);
  }

  return owner.businessId;
}

/** Re-reads a subscription from Polar and syncs it (webhook fallback / manual refresh). */
export async function syncSubscriptionById(
  subscriptionId: string,
  options?: { forceStatus?: "active" | "canceled" | "past_due" | "expired" },
): Promise<string | null> {
  const { getPolarSubscription } = await import("./polar.server");
  return syncSubscription(await getPolarSubscription(subscriptionId), options);
}

export async function markPaymentFailed(businessId: string): Promise<void> {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due", last_payment_failed_at: new Date().toISOString() })
    .eq("business_id", businessId);

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_id")
    .eq("business_id", businessId)
    .maybeSingle();
  await notifyBilling(businessId, "failed", sub?.plan_id);
}
