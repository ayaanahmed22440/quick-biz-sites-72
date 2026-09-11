import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type PublishedSite = {
  business: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    address_line1: string | null;
    country: string | null;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    primary_service: string | null;
  };
  website: { id: string; template_id: string | null; published_at: string | null };
  content: JsonValue | null;
  services: { id: string; name: string; description: string | null; price_note: string | null }[];
  service_areas: { id: string; city: string; state: string | null }[];
  hours: {
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    is_closed: boolean;
  }[];
  reviews?: {
    id: string;
    author_name: string;
    location: string | null;
    rating: number | null;
    quote: string;
    source: string | null;
  }[];
  seo: {
    meta_title: string | null;
    meta_description: string | null;
    indexing_enabled: boolean;
    localbusiness_schema: boolean;
    service_schema: boolean;
    primary_city: string | null;
    primary_keyword: string | null;
  } | null;
};

export const getPublishedSite = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: site, error } = await supabase.rpc("get_published_site", { p_slug: data.slug });
    if (error) throw new Error(error.message);
    return (site ?? null) as PublishedSite | null;
  });

/** Hostnames that always serve the WebWarheads marketing site, never a customer site. */
function isPlatformHost(host: string) {
  return (
    host === "webwarheads.com" ||
    host === "www.webwarheads.com" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovable.dev")
  );
}

export type HostedSite = { slug: string; site: PublishedSite };

/**
 * Works out whether the current request arrived on a customer's own domain.
 * Returns null for the platform's own hostnames so the marketing site shows.
 */
export const getSiteForHost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({ host: z.string().max(253).nullable().optional() })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const headerHost = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
    const raw = (data.host ?? headerHost ?? "")
      .toLowerCase()
      .trim()
      .split(":")[0];
    if (!raw || isPlatformHost(raw)) return null;

    const bare = raw.replace(/^www\./, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("domains")
      .select("business_id")
      .eq("domain", bare)
      .limit(1);
    const businessId = rows?.[0]?.business_id;
    if (!businessId) return null;

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("slug, suspended")
      .eq("id", businessId)
      .maybeSingle();
    if (!business || business.suspended) return null;

    const supabase = publicClient();
    const { data: site } = await supabase.rpc("get_published_site", { p_slug: business.slug });
    if (!site) return null;
    return { slug: business.slug, site: site as PublishedSite } satisfies HostedSite;
  });

export const submitWebsiteLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(120),
        name: z.string().min(1).max(120),
        email: z.string().max(200).optional().default(""),
        phone: z.string().max(40).optional().default(""),
        service: z.string().max(120).optional().default(""),
        preferred_time: z.string().max(120).optional().default(""),
        message: z.string().max(2000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { enforceRateLimit, callerKey } = await import("./rate-limit.server");
    const caller = callerKey();
    await enforceRateLimit({
      bucket: "lead",
      subject: caller,
      limit: 10,
      windowSeconds: 3600,
      message: "Too many enquiries from this connection. Please try again later.",
    });
    await enforceRateLimit({
      bucket: `lead:${data.slug}`,
      subject: caller,
      limit: 3,
      windowSeconds: 900,
      message: "You've already sent this business a message. Please try again later.",
    });

    const supabase = publicClient();
    const args: Record<string, string> = { p_slug: data.slug, p_name: data.name };
    if (data.email) args["p_email"] = data.email;
    if (data.phone) args["p_phone"] = data.phone;
    if (data.service) args["p_service"] = data.service;
    if (data.preferred_time) args["p_preferred_time"] = data.preferred_time;
    if (data.message) args["p_message"] = data.message;
    const { error } = await supabase.rpc(
      "submit_website_lead",
      args as unknown as { p_slug: string; p_name: string },
    );
    if (error) throw new Error(error.message);

    // Tell the business owner straight away. A mail failure must never lose the lead.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("id, name, email")
        .eq("slug", data.slug)
        .maybeSingle();
      if (business?.email) {
        const { sendNewLeadEmail } = await import("@/lib/emails.server");
        await sendNewLeadEmail({
          to: business.email,
          businessId: business.id,
          businessName: business.name,
          lead: {
            name: data.name,
            ...(data.email ? { email: data.email } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.service ? { service: data.service } : {}),
            ...(data.preferred_time ? { preferred_time: data.preferred_time } : {}),
            ...(data.message ? { message: data.message } : {}),
          },
        });
      }
    } catch (mailError) {
      console.error("Lead notification failed", mailError);
    }

    return { ok: true };
  });
