import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ businessId: z.string().uuid() });

/**
 * Permanently removes a customer: their website, content, media, leads and the
 * sign-in account itself. Billing history rows are kept (unlinked) so revenue
 * reporting stays accurate. Admin only, and never an account holding admin.
 */
export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("Administrator access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const businessId = data.businessId;

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", businessId)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) throw new Error("That client no longer exists");

    const ownerId = business.owner_id;
    if (ownerId === context.userId) throw new Error("You cannot delete your own account");

    const { data: ownerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", ownerId);
    if ((ownerRoles ?? []).some((r) => r.role === "admin")) {
      throw new Error("That account is an administrator — remove its admin access first");
    }

    // Stored files first: rows are the only pointer to them.
    const { data: mediaRows } = await supabaseAdmin
      .from("media")
      .select("storage_path")
      .eq("business_id", businessId);
    const paths = (mediaRows ?? [])
      .map((m) => m.storage_path)
      .filter((p): p is string => Boolean(p));
    if (paths.length) await supabaseAdmin.storage.from("business-media").remove(paths);

    const { data: websites } = await supabaseAdmin
      .from("websites")
      .select("id")
      .eq("business_id", businessId);

    // Keep the money trail, drop the link to the deleted tenant.
    await supabaseAdmin.from("billing_events").update({ business_id: null }).eq("business_id", businessId);
    await supabaseAdmin.from("sent_emails").update({ business_id: null }).eq("business_id", businessId);
    await supabaseAdmin.from("activity_logs").update({ business_id: null }).eq("business_id", businessId);

    const scoped = [
      "ticket_messages",
      "support_tickets",
      "website_customizations",
      "media",
      "leads",
      "seo_targets",
      "seo_settings",
      "service_areas",
      "services",
      "business_hours",
      "business_reviews",
      "domains",
      "integrations",
      "notifications",
      "checkout_sessions",
      "subscriptions",
      "business_members",
    ] as const;

    for (const table of scoped) {
      const { error } = await supabaseAdmin.from(table).delete().eq("business_id", businessId);
      if (error) throw error;
    }

    if (websites?.length) {
      const { error } = await supabaseAdmin.from("websites").delete().eq("business_id", businessId);
      if (error) throw error;
    }

    const { error: deleteBusinessError } = await supabaseAdmin
      .from("businesses")
      .delete()
      .eq("id", businessId);
    if (deleteBusinessError) throw deleteBusinessError;

    // Only remove the person if this was their last business.
    const { data: remaining } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_id", ownerId)
      .limit(1);

    let accountRemoved = false;
    if (!remaining?.length) {
      await supabaseAdmin.from("notifications").delete().eq("user_id", ownerId);
      await supabaseAdmin.from("business_members").delete().eq("user_id", ownerId);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", ownerId);
      await supabaseAdmin.from("profiles").delete().eq("id", ownerId);
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(ownerId);
      if (authError) throw new Error(authError.message);
      accountRemoved = true;
    }

    await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      action: "admin.delete_customer",
      meta: { business_name: business.name, business_id: businessId, account_removed: accountRemoved },
    });

    return { deleted: true, accountRemoved };
  });

const clearCooldownSchema = z.object({ businessId: z.string().uuid() });

async function requireStaff(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isStaff, error } = await (context.supabase as any).rpc("is_platform_staff", {
    _user_id: context.userId,
  });
  if (error) throw error;
  if (!isStaff) throw new Error("Staff access required");
}

/**
 * Recent checkout attempts plus the card-testing signal: how many declined
 * payments each account has had in the cooldown window, and whether checkout
 * is currently blocked for it.
 */
export const listCheckoutAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as never);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { CHECKOUT_BUCKETS, CHECKOUT_LIMITS } = await import("./checkout-guard.server");

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [sessionsResult, failuresResult] = await Promise.all([
      supabaseAdmin
        .from("checkout_sessions")
        .select("id, business_id, plan_id, status, created_at, completed_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("rate_limit_hits")
        .select("subject, created_at")
        .eq("bucket", CHECKOUT_BUCKETS.failures)
        .gte("created_at", new Date(Date.now() - CHECKOUT_LIMITS.cooldownSeconds * 1000).toISOString()),
    ]);

    const sessions = sessionsResult.data ?? [];
    const businessIds = Array.from(
      new Set([
        ...sessions.map((s) => s.business_id),
        ...(failuresResult.data ?? []).map((f) => f.subject),
      ]),
    );
    const { data: businesses } = businessIds.length
      ? await supabaseAdmin.from("businesses").select("id, name").in("id", businessIds)
      : { data: [] as { id: string; name: string }[] };
    const names = new Map((businesses ?? []).map((b) => [b.id, b.name]));

    const failureCounts = new Map<string, number>();
    for (const row of failuresResult.data ?? []) {
      failureCounts.set(row.subject, (failureCounts.get(row.subject) ?? 0) + 1);
    }

    return {
      threshold: CHECKOUT_LIMITS.failures.limit,
      attempts: sessions.map((s) => ({
        id: s.id,
        businessId: s.business_id,
        businessName: names.get(s.business_id) ?? "Unknown",
        planId: s.plan_id,
        status: s.status,
        createdAt: s.created_at,
        completedAt: s.completed_at,
      })),
      blocked: Array.from(failureCounts.entries())
        .map(([businessId, failures]) => ({
          businessId,
          businessName: names.get(businessId) ?? "Unknown",
          failures,
          isBlocked: failures >= CHECKOUT_LIMITS.failures.limit,
        }))
        .sort((a, b) => b.failures - a.failures),
    };
  });

/** Releases a customer whose checkout was auto-blocked after declines. */
export const clearCheckoutCooldown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => clearCooldownSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const { clearPaymentFailures } = await import("./checkout-guard.server");
    await clearPaymentFailures(data.businessId);
    return { ok: true };
  });
