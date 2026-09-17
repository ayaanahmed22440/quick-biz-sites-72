/**
 * Server-only helpers for team-built demo sites ("Manual Sites").
 *
 * A manual site is a real business + published website created by staff for a
 * prospect who came in through Messenger or direct outreach. It behaves exactly
 * like a normal customer site except it carries a pending banner and an expiry
 * until the Polar payment lands.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const MANUAL_DEFAULT_HOURS = 12;

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "business"
  );
}

/** Reserved top-level paths that must never be taken by a customer slug. */
const RESERVED = new Set([
  "auth",
  "admin",
  "api",
  "blog",
  "pricing",
  "contact",
  "onboarding",
  "dashboard",
  "website",
  "billing",
  "s",
  "terms",
  "privacy",
]);

export async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (RESERVED.has(candidate)) continue;
    const { data } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** Finds an existing auth user by email, or creates a silent passwordless one. */
export async function findOrCreateOwner(
  email: string,
  fullName?: string | null,
): Promise<{ id: string; existing: boolean }> {
  const normalised = email.trim().toLowerCase();

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalised,
    email_confirm: true,
    ...(fullName ? { user_metadata: { full_name: fullName } } : {}),
  });
  if (created?.user && !error) return { id: created.user.id, existing: false };

  // Already registered — reuse that account rather than creating a duplicate.
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const match = (list?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === normalised);
  if (match) return { id: match.id, existing: true };

  throw new Error(error?.message ?? "Could not create the customer account.");
}

/**
 * Turns a paid manual site into a permanent customer site.
 * Safe to call repeatedly — the Polar webhook may deliver more than once.
 */
export async function markManualSitePaid(businessId: string): Promise<void> {
  const { data: manual } = await supabaseAdmin
    .from("manual_sites")
    .select("id, status, contact_email, owner_user_id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!manual || manual.status === "paid") return;

  await supabaseAdmin
    .from("manual_sites")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", manual.id);

  // The site becomes a normal, indexable customer website.
  await supabaseAdmin
    .from("seo_settings")
    .update({ indexing_enabled: true, sitemap_enabled: true })
    .eq("business_id", businessId);

  await supabaseAdmin
    .from("businesses")
    .update({ onboarding_completed: true })
    .eq("id", businessId);

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, email")
    .eq("id", businessId)
    .maybeSingle();

  try {
    const emails = await import("@/lib/emails.server");
    const to = manual.contact_email || business?.email;
    if (to && business) {
      await emails.sendManualSiteActivatedEmail({
        to,
        businessId,
        businessName: business.name,
        slug: business.slug,
      });
    }
  } catch (error) {
    console.error("[manual site] activation email failed", error);
  }
}
