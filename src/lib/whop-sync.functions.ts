import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Direct Whop API sync, used as a fallback when the webhook hasn't arrived yet
 * (e.g. the customer is redirected back from checkout within seconds of paying).
 *
 * Looks up the signed-in user's memberships in Whop by email, and mirrors any
 * valid membership into `subscriptions` — the same shape the webhook writes,
 * so both paths stay consistent.
 */

type WhopMembership = {
  id?: string;
  valid?: boolean;
  status?: string;
  plan_id?: string;
  plan?: { id?: string };
  renewal_period_end?: number | string | null;
  cancel_at_period_end?: boolean | null;
  email?: string | null;
  user?: { email?: string | null } | null;
};

const STATUS_MAP: Record<string, string> = {
  active: "active",
  trialing: "trialing",
  completed: "active",
  past_due: "past_due",
  unresolved: "past_due",
  canceled: "canceled",
  cancelled: "canceled",
  expired: "expired",
};

export const syncWhopSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env["WHOP_API_KEY"];
    if (!apiKey) return { ok: false as const, reason: "whop_api_key_not_configured" };

    const {
      data: { user },
    } = await context.supabase.auth.getUser();
    const email = user?.email?.trim().toLowerCase();
    if (!email) return { ok: false as const, reason: "no_user_email" };

    // Whop memberships API — filter to this buyer's email.
    const url = new URL("https://api.whop.com/api/v2/memberships");
    url.searchParams.set("email", email);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false as const, reason: `whop_api_${res.status}` };
    }
    const json = (await res.json()) as { data?: WhopMembership[] };
    const memberships = json.data ?? [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find the business this user owns.
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!business) return { ok: false as const, reason: "no_business" };

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id, plan_id")
      .eq("business_id", business.id)
      .maybeSingle();

    // Prefer a valid membership whose plan we recognize.
    let synced: string | null = null;
    for (const m of memberships) {
      const whopPlanId = m.plan_id ?? m.plan?.id;
      if (!whopPlanId) continue;

      const { data: plan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("whop_plan_id", whopPlanId)
        .maybeSingle();
      if (!plan) continue;

      const status = m.valid === false ? "canceled" : (STATUS_MAP[m.status ?? ""] ?? "active");
      const periodEnd = m.renewal_period_end
        ? new Date(
            typeof m.renewal_period_end === "number"
              ? m.renewal_period_end * 1000
              : m.renewal_period_end,
          ).toISOString()
        : null;

      const row = {
        business_id: business.id,
        plan_id: plan.id,
        provider: "whop",
        status: status as "active",
        whop_membership_id: m.id ?? null,
        whop_plan_id: whopPlanId,
        current_period_end: periodEnd,
        cancel_at_period_end: m.cancel_at_period_end ?? false,
      };

      const { error } = existing
        ? await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id)
        : await supabaseAdmin.from("subscriptions").insert(row);
      if (error) return { ok: false as const, reason: error.message };

      synced = `${plan.id}/${status}`;
      await supabaseAdmin.from("activity_logs").insert({
        business_id: business.id,
        action: "whop:api_sync",
        meta: { note: `subscription synced from Whop API as ${synced}`, membership_id: m.id ?? null },
      });
      break;
    }

    if (!synced) return { ok: false as const, reason: "no_matching_membership" };
    return { ok: true as const, synced };
  });
