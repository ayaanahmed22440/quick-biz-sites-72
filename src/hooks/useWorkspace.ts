import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { entitlementsFor, NO_ENTITLEMENTS, type Entitlements } from "@/lib/plans";

export type Workspace = {
  userId: string;
  email: string | null;
  fullName: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  business: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
    onboarding_completed: boolean;
  } | null;
  subscription: {
    plan_id: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  entitlements: Entitlements;
};

export const workspaceQueryKey = ["workspace"] as const;

async function fetchWorkspace(): Promise<Workspace | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: roles }, { data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("business_members").select("business_id").eq("user_id", user.id),
  ]);

  // Only the businesses this person actually owns or belongs to. Platform staff
  // can read every tenant, so without this filter a team account would be shown
  // somebody else's business.
  const memberIds = (memberships ?? []).map((m) => m.business_id);
  const ownFilter = [
    `owner_id.eq.${user.id}`,
    ...(memberIds.length ? [`id.in.(${memberIds.join(",")})`] : []),
  ].join(",");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, city, state, phone, email, onboarding_completed")
    .or(ownFilter)
    .order("created_at", { ascending: true })
    .limit(1);

  const business = businesses?.[0] ?? null;

  let subscription: Workspace["subscription"] = null;
  if (business) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_end, cancel_at_period_end")
      .eq("business_id", business.id)
      .maybeSingle();
    subscription = data ?? null;
  }

  const roleValues = (roles ?? []).map((r) => r.role);

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    isStaff: roleValues.includes("admin") || roleValues.includes("staff"),
    isAdmin: roleValues.includes("admin"),
    business,
    subscription,
    entitlements: subscription
      ? entitlementsFor(subscription.plan_id, subscription.status)
      : NO_ENTITLEMENTS,
  };
}

export function useWorkspace() {
  return useQuery({ queryKey: workspaceQueryKey, queryFn: fetchWorkspace, staleTime: 30_000 });
}
