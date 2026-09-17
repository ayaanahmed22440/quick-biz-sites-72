import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlatformUser = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  isStaff: boolean;
  business: { id: string; name: string; niche: string; slug: string; completed: boolean } | null;
  plan: { id: string; status: string } | null;
  websiteStatus: string | null;
  onboarding: {
    completed: boolean;
    stepIndex: number;
    totalSteps: number;
    lastStep: string;
    lastStepLabel: string | null;
    answers: Record<string, string>;
    updatedAt: string;
  } | null;
};

export type AdminNotification = {
  id: string;
  kind: "signup" | "completed" | "stalled";
  userId: string;
  title: string;
  detail: string;
  at: string;
};

/**
 * Everyone who has an account, with how far they got through the questionnaire
 * and what they answered. Staff only — read with the service role because the
 * sign-in accounts themselves live outside the app tables.
 */
export const listPlatformUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff, error: staffError } = await context.supabase.rpc("is_platform_staff", {
      _user_id: context.userId,
    });
    if (staffError) throw staffError;
    if (!isStaff) throw new Error("Staff access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [authUsers, profiles, businesses, subscriptions, websites, progress, roles] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        supabaseAdmin.from("profiles").select("id, email, full_name"),
        supabaseAdmin
          .from("businesses")
          .select("id, owner_id, name, niche, slug, onboarding_completed"),
        supabaseAdmin.from("subscriptions").select("business_id, plan_id, status"),
        supabaseAdmin.from("websites").select("business_id, status"),
        supabaseAdmin
          .from("onboarding_progress")
          .select(
            "user_id, completed, step_index, total_steps, last_step, last_step_label, answers, updated_at",
          ),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);

    // Prospects with an unpaid team-built demo aren't customers yet — they live
    // in Manual Sites until their payment lands.
    const { data: manual } = await supabaseAdmin
      .from("manual_sites")
      .select("owner_user_id, status");
    const pendingProspects = new Set(
      (manual ?? []).filter((m) => m.status !== "paid").map((m) => m.owner_user_id),
    );

    const profileBy = new Map((profiles.data ?? []).map((p) => [p.id, p]));
    const businessBy = new Map((businesses.data ?? []).map((b) => [b.owner_id, b]));
    const subBy = new Map((subscriptions.data ?? []).map((s) => [s.business_id, s]));
    const siteBy = new Map((websites.data ?? []).map((w) => [w.business_id, w]));
    const progressBy = new Map((progress.data ?? []).map((p) => [p.user_id, p]));
    const staffIds = new Set(
      (roles.data ?? []).filter((r) => r.role !== "customer").map((r) => r.user_id),
    );

    const users: PlatformUser[] = (authUsers.data?.users ?? []).map((user) => {
      const profile = profileBy.get(user.id);
      const business = businessBy.get(user.id) ?? null;
      const sub = business ? (subBy.get(business.id) ?? null) : null;
      const site = business ? (siteBy.get(business.id) ?? null) : null;
      const row = progressBy.get(user.id) ?? null;
      const metadata = user.user_metadata as { full_name?: string } | null;

      return {
        id: user.id,
        email: user.email ?? profile?.email ?? "",
        fullName: profile?.full_name ?? metadata?.full_name ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        isStaff: staffIds.has(user.id),
        business: business
          ? {
              id: business.id,
              name: business.name,
              niche: business.niche,
              slug: business.slug,
              completed: business.onboarding_completed,
            }
          : null,
        plan: sub ? { id: sub.plan_id, status: sub.status } : null,
        websiteStatus: site?.status ?? null,
        onboarding: row
          ? {
              completed: row.completed,
              stepIndex: row.step_index,
              totalSteps: row.total_steps,
              lastStep: row.last_step,
              lastStepLabel: row.last_step_label,
              answers: (row.answers ?? {}) as Record<string, string>,
              updatedAt: row.updated_at,
            }
          : null,
      };
    });

    users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const now = Date.now();
    const recent = (iso: string) => now - new Date(iso).getTime() < 14 * 24 * 60 * 60 * 1000;
    const notifications: AdminNotification[] = [];

    for (const user of users) {
      if (user.isStaff) continue;
      if (recent(user.createdAt)) {
        notifications.push({
          id: `signup-${user.id}`,
          kind: "signup",
          userId: user.id,
          title: "New sign up",
          detail: user.email || "New account",
          at: user.createdAt,
        });
      }
      const row = user.onboarding;
      if (!row) continue;
      if (row.completed && recent(row.updatedAt)) {
        notifications.push({
          id: `done-${user.id}`,
          kind: "completed",
          userId: user.id,
          title: "Finished the questionnaire",
          detail: `${user.business?.name ?? user.email} — ${user.business?.niche ?? "website"} website ready`,
          at: row.updatedAt,
        });
      } else if (
        !row.completed &&
        recent(row.updatedAt) &&
        now - new Date(row.updatedAt).getTime() > 30 * 60 * 1000
      ) {
        notifications.push({
          id: `stalled-${user.id}`,
          kind: "stalled",
          userId: user.id,
          title: "Stopped part way",
          detail: `${user.email} stopped at “${row.lastStepLabel ?? row.lastStep}” (step ${row.stepIndex + 1}${row.totalSteps ? ` of ${row.totalSteps}` : ""})`,
          at: row.updatedAt,
        });
      }
    }

    notifications.sort((a, b) => b.at.localeCompare(a.at));

    return { users, notifications: notifications.slice(0, 50) };
  });
