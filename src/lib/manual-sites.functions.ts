import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultSiteContent } from "@/lib/site-content";
import { presetFor } from "@/lib/template-registry";

export type ManualSite = {
  id: string;
  businessId: string;
  businessName: string;
  slug: string;
  url: string;
  niche: string;
  planId: string;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  status: "pending" | "paid" | "expired" | "cancelled";
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  notes: string | null;
};

const SITE_URL = "https://www.webwarheads.com";

async function assertStaff(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isStaff, error } = await (
    context.supabase as unknown as {
      rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: boolean; error: unknown }>;
    }
  ).rpc("is_platform_staff", { _user_id: context.userId });
  if (error) throw error;
  if (!isStaff) throw new Error("Staff access required");
}

/* ------------------------------------------------------------------- list */

export const listManualSites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("manual_sites")
      .select(
        "id, business_id, plan_id, contact_name, contact_email, contact_phone, status, expires_at, paid_at, created_at, notes",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((row) => row.business_id);
    const { data: businesses } = ids.length
      ? await supabaseAdmin.from("businesses").select("id, name, slug, niche").in("id", ids)
      : { data: [] as { id: string; name: string; slug: string; niche: string }[] };
    const byId = new Map((businesses ?? []).map((b) => [b.id, b]));

    const now = Date.now();
    return (data ?? []).map((row) => {
      const business = byId.get(row.business_id);
      const expired = row.status === "pending" && new Date(row.expires_at).getTime() <= now;
      return {
        id: row.id,
        businessId: row.business_id,
        businessName: business?.name ?? "Unknown business",
        slug: business?.slug ?? "",
        url: `${SITE_URL}/${business?.slug ?? ""}`,
        niche: business?.niche ?? "",
        planId: row.plan_id,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        status: (expired ? "expired" : row.status) as ManualSite["status"],
        expiresAt: row.expires_at,
        paidAt: row.paid_at,
        createdAt: row.created_at,
        notes: row.notes,
      } satisfies ManualSite;
    });
  });

/* ----------------------------------------------------------------- create */

const createInput = z.object({
  businessName: z.string().trim().min(2).max(120),
  niche: z.string().trim().min(1).max(60),
  contactName: z.string().trim().max(120).optional().default(""),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().max(40).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().max(80).optional().default(""),
  primaryService: z.string().trim().max(120).optional().default(""),
  tagline: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  services: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).optional().default(""),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  areas: z.string().trim().max(1000).optional().default(""),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  logoUrl: z.string().trim().max(500).optional().default(""),
  heroImageUrl: z.string().trim().max(500).optional().default(""),
  aboutImageUrl: z.string().trim().max(500).optional().default(""),
  galleryUrls: z.array(z.string().trim().max(500)).max(6).optional().default([]),
  planId: z.string().trim().min(2).max(40),
  hours: z.number().int().min(1).max(720).default(12),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const createManualSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { findOrCreateOwner, uniqueSlug } = await import("./manual-sites.server");

    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id, is_active")
      .eq("id", data.planId)
      .maybeSingle();
    if (!plan?.is_active) throw new Error("That plan is not available.");

    const owner = await findOrCreateOwner(data.contactEmail, data.contactName || null);

    // One demo per business owner keeps the admin list unambiguous.
    const { data: clash } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_id", owner.id)
      .limit(1)
      .maybeSingle();
    if (clash) {
      const { data: existingManual } = await supabaseAdmin
        .from("manual_sites")
        .select("id")
        .eq("business_id", clash.id)
        .maybeSingle();
      throw new Error(
        existingManual
          ? "That email already has a demo site. Edit or delete it first."
          : "That email already belongs to a customer account.",
      );
    }

    const preset = presetFor(data.niche);
    const slug = await uniqueSlug(data.businessName);
    const primaryColor = data.primaryColor || preset.accent;

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        owner_id: owner.id,
        name: data.businessName,
        slug,
        niche: data.niche,
        tagline: data.tagline || null,
        description: data.description || null,
        primary_service: data.primaryService || preset.copy.service,
        email: data.contactEmail,
        phone: data.contactPhone || null,
        city: data.city || null,
        state: data.state || null,
        logo_url: data.logoUrl || null,
        primary_color: primaryColor,
        onboarding_completed: true,
      })
      .select("id, name, slug")
      .single();
    if (businessError) throw new Error(businessError.message);

    const businessId = business.id;

    const services = data.services
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (services.length) {
      await supabaseAdmin
        .from("services")
        .insert(services.map((name, i) => ({ business_id: businessId, name, sort_order: i })));
    }

    const areas = data.areas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);
    const areaRows = [
      ...(data.city ? [{ business_id: businessId, city: data.city, state: data.state || null, is_primary: true }] : []),
      ...areas.map((city) => ({
        business_id: businessId,
        city,
        state: data.state || null,
        is_primary: false,
      })),
    ];
    if (areaRows.length) await supabaseAdmin.from("service_areas").insert(areaRows);

    const content = defaultSiteContent({
      businessName: data.businessName,
      city: data.city,
      primaryService: data.primaryService || preset.copy.service,
      primaryColor,
      logoUrl: data.logoUrl || null,
      niche: data.niche,
    });
    if (data.tagline) content.hero.subheadline = data.tagline;
    if (data.description) content.about.body = data.description;
    if (data.heroImageUrl) content.images.hero = data.heroImageUrl;
    if (data.aboutImageUrl) content.images.about = data.aboutImageUrl;
    if (data.galleryUrls.length) content.images.gallery = data.galleryUrls;

    const { data: template } = await supabaseAdmin
      .from("templates")
      .select("id")
      .eq("slug", content.templateId)
      .maybeSingle();

    const publishedAt = new Date().toISOString();
    const { data: website, error: websiteError } = await supabaseAdmin
      .from("websites")
      .insert({
        business_id: businessId,
        template_id: template?.id ?? null,
        status: "published",
        published_at: publishedAt,
      })
      .select("id")
      .single();
    if (websiteError) throw new Error(websiteError.message);

    const json = JSON.parse(JSON.stringify(content)) as never;
    await supabaseAdmin.from("website_customizations").upsert(
      {
        website_id: website.id,
        business_id: businessId,
        draft_content: json,
        published_content: json,
        updated_at: publishedAt,
      },
      { onConflict: "website_id" },
    );

    // An unpaid demo must never reach Google.
    await supabaseAdmin.from("seo_settings").upsert(
      {
        business_id: businessId,
        indexing_enabled: false,
        sitemap_enabled: false,
        primary_city: data.city || null,
      },
      { onConflict: "business_id" },
    );

    const expiresAt = new Date(Date.now() + data.hours * 3600_000).toISOString();
    const { data: manual, error: manualError } = await supabaseAdmin
      .from("manual_sites")
      .insert({
        business_id: businessId,
        owner_user_id: owner.id,
        created_by: context.userId,
        contact_name: data.contactName || null,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone || null,
        plan_id: data.planId,
        expires_at: expiresAt,
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (manualError) throw new Error(manualError.message);

    await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      business_id: businessId,
      action: "manual_site.create",
      meta: { slug: business.slug, plan_id: data.planId } as never,
    });

    return {
      id: manual.id,
      businessId,
      slug: business.slug,
      url: `${SITE_URL}/${business.slug}`,
      expiresAt,
    };
  });

/* ---------------------------------------------------------------- actions */

export const extendManualSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), hours: z.number().int().min(1).max(720) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("manual_sites")
      .select("expires_at, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Demo site not found.");
    if (row.status === "paid") return { expiresAt: row.expires_at };

    // Expired demos restart from now; live ones simply get more time.
    const from = Math.max(Date.now(), new Date(row.expires_at).getTime());
    const expiresAt = new Date(from + data.hours * 3600_000).toISOString();
    const { error } = await supabaseAdmin
      .from("manual_sites")
      .update({ expires_at: expiresAt, status: "pending" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { expiresAt };
  });

export const resendManualLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("manual_sites")
      .select("business_id, contact_email, contact_name, expires_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Demo site not found.");
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("name, slug")
      .eq("id", row.business_id)
      .maybeSingle();
    if (!business) throw new Error("Business not found.");

    const { sendManualPreviewEmail } = await import("@/lib/emails.server");
    const result = await sendManualPreviewEmail({
      to: row.contact_email,
      businessId: row.business_id,
      businessName: business.name,
      slug: business.slug,
      expiresAt: row.expires_at,
      contactName: row.contact_name,
    });
    return { sent: Boolean((result as { sent?: boolean }).sent ?? true) };
  });

export const deleteManualSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("manual_sites")
      .select("business_id, owner_user_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { deleted: false };
    if (row.status === "paid") throw new Error("This is a paying customer — manage them in Clients.");

    const businessId = row.business_id;
    await supabaseAdmin.from("manual_sites").delete().eq("id", data.id);
    for (const table of [
      "website_customizations",
      "websites",
      "services",
      "service_areas",
      "business_hours",
      "business_reviews",
      "seo_settings",
      "seo_targets",
      "media",
      "leads",
      "domains",
      "integrations",
      "checkout_sessions",
    ] as const) {
      await supabaseAdmin.from(table).delete().eq("business_id", businessId);
    }
    await supabaseAdmin.from("businesses").delete().eq("id", businessId);
    // The silently created prospect account goes with the demo.
    await supabaseAdmin.auth.admin.deleteUser(row.owner_user_id).catch(() => undefined);

    await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      action: "manual_site.delete",
      meta: { business_id: businessId } as never,
    });
    return { deleted: true };
  });
