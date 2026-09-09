/** Server-only: writes verified Whop membership state into our subscriptions table. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getWhopMembership, mapWhopStatus, toIso, type WhopMembership } from "./whop.server";

type Resolved = { businessId: string; planId: string } | null;

/** Finds our business + internal plan for a Whop membership, without trusting the browser. */
export async function resolveMembershipOwner(membership: WhopMembership): Promise<Resolved> {
  const meta = (membership.metadata ?? {}) as Record<string, unknown>;
  const sessionId = typeof meta["checkout_session_id"] === "string" ? meta["checkout_session_id"] : null;
  const metaBusiness = typeof meta["business_id"] === "string" ? meta["business_id"] : null;
  const metaPlan = typeof meta["plan_id"] === "string" ? meta["plan_id"] : null;
  const whopPlanId = membership.plan ?? membership.plan_id ?? null;

  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("checkout_sessions")
      .select("business_id, plan_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (data) return { businessId: data.business_id, planId: data.plan_id };
  }

  if (metaBusiness && metaPlan) return { businessId: metaBusiness, planId: metaPlan };

  // Already-known membership (renewals, cancellations).
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("business_id, plan_id")
    .eq("whop_membership_id", membership.id)
    .maybeSingle();
  if (existing) return { businessId: existing.business_id, planId: existing.plan_id };

  // Last resort: map the Whop plan back to one of our plans and the newest pending checkout.
  if (whopPlanId) {
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("whop_plan_id", whopPlanId)
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

/** Upserts the subscription row for a membership. Returns the business it belongs to. */
export async function syncMembership(
  membership: WhopMembership,
  options?: { forceStatus?: "active" | "canceled" | "past_due" },
): Promise<string | null> {
  const owner = await resolveMembershipOwner(membership);
  if (!owner) return null;

  const status = options?.forceStatus ?? mapWhopStatus(membership.status, membership.valid);
  const row = {
    business_id: owner.businessId,
    plan_id: owner.planId,
    provider: "whop",
    status,
    whop_membership_id: membership.id,
    whop_plan_id: membership.plan ?? membership.plan_id ?? null,
    whop_user_id: membership.user ?? membership.user_id ?? null,
    current_period_start: toIso(membership.renewal_period_start),
    current_period_end: toIso(membership.renewal_period_end),
    cancel_at_period_end: Boolean(membership.cancel_at_period_end),
    canceled_at: status === "canceled" ? new Date().toISOString() : null,
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

  return owner.businessId;
}

/** Re-reads a membership from Whop and syncs it (used as a webhook fallback). */
export async function syncMembershipById(membershipId: string): Promise<string | null> {
  const membership = await getWhopMembership(membershipId);
  return syncMembership(membership);
}

export async function markPaymentFailed(businessId: string): Promise<void> {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due", last_payment_failed_at: new Date().toISOString() })
    .eq("business_id", businessId);
}
