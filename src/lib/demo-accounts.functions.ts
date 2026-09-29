import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const planEnum = z.enum(["free", "basic", "seo", "premium"]);

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!isAdmin) throw new Error("Administrator access required");
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "demo"
  );
}

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  planId: planEnum,
  businessName: z.string().min(2).max(80),
  niche: z.string().min(2).max(60).default("cleaning"),
});

/**
 * Creates a reviewer/test account that can sign in with email + password
 * immediately (no confirmation email, no payment). Paid plans are granted
 * through a manual subscription row, never through the payment provider.
 */
export const createDemoAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { is_demo: true, full_name: data.businessName },
    });
    if (createError) throw new Error(createError.message);
    const userId = created.user!.id;

    let slug = slugify(data.businessName);
    const { data: existing } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        owner_id: userId,
        name: data.businessName,
        slug,
        niche: data.niche,
        tagline: "Trusted local service, done right.",
        description: `${data.businessName} is a demo account used for product review and testing.`,
        primary_service: data.niche,
        email: data.email,
        city: "Austin",
        state: "TX",
        country: "US",
        onboarding_completed: true,
      })
      .select("id, slug")
      .single();
    if (businessError) throw businessError;

    const { error: websiteError } = await supabaseAdmin
      .from("websites")
      .insert({ business_id: business.id, status: "draft" });
    if (websiteError) throw websiteError;

    if (data.planId !== "free") {
      const { error: subError } = await supabaseAdmin.from("subscriptions").insert({
        business_id: business.id,
        plan_id: data.planId,
        status: "active",
        provider: "manual",
        polar_subscription_id: `demo_${business.id}`,
      });
      if (subError) throw subError;
    }

    await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      business_id: business.id,
      action: "admin.create_demo_account",
      meta: { email: data.email, plan_id: data.planId },
    });

    return { userId, businessId: business.id, slug: business.slug };
  });

/** Every demo/test account with its plan and site status. */
export const listDemoAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const demoUsers = users.users.filter((u) => (u.user_metadata as any)?.is_demo === true);
    if (!demoUsers.length) return [];

    const ids = demoUsers.map((u) => u.id);
    const { data: businesses } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug, owner_id")
      .in("owner_id", ids);
    const businessIds = (businesses ?? []).map((b) => b.id);
    const { data: subs } = businessIds.length
      ? await supabaseAdmin
          .from("subscriptions")
          .select("business_id, plan_id, status")
          .in("business_id", businessIds)
      : { data: [] as any[] };
    const { data: sites } = businessIds.length
      ? await supabaseAdmin.from("websites").select("business_id, status").in("business_id", businessIds)
      : { data: [] as any[] };

    return demoUsers.map((u) => {
      const business = (businesses ?? []).find((b) => b.owner_id === u.id) ?? null;
      const sub = business ? (subs ?? []).find((s) => s.business_id === business.id) : null;
      const site = business ? (sites ?? []).find((s) => s.business_id === business.id) : null;
      return {
        userId: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        businessId: business?.id ?? null,
        businessName: business?.name ?? null,
        slug: business?.slug ?? null,
        planId: sub?.status === "active" ? sub.plan_id : "free",
        websiteStatus: site?.status ?? null,
      };
    });
  });

const planSchema = z.object({ businessId: z.string().uuid(), planId: planEnum });

/** Switches a demo account between the free and paid plans instantly. */
export const updateDemoAccountPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => planSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("subscriptions").delete().eq("business_id", data.businessId);
    if (data.planId !== "free") {
      const { error } = await supabaseAdmin.from("subscriptions").insert({
        business_id: data.businessId,
        plan_id: data.planId,
        status: "active",
        provider: "manual",
        polar_subscription_id: `demo_${data.businessId}`,
      });
      if (error) throw error;
    }
    return { updated: true };
  });

const passwordSchema = z.object({ userId: z.string().uuid(), password: z.string().min(8) });

/** Sets a new sign-in password on a demo account. */
export const resetDemoAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => passwordSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { updated: true };
  });
