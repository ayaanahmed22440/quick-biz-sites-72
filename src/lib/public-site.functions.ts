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
        const { sendGmail, emailShell } = await import("@/lib/gmail.server");
        const row = (label: string, value: string) =>
          value
            ? `<p style="margin:0 0 8px;font-size:15px;"><strong>${label}:</strong> ${value}</p>`
            : "";
        await sendGmail({
          to: business.email,
          replyTo: data.email || undefined,
          purpose: "new_lead",
          businessId: business.id,
          subject: `New enquiry from ${data.name}`,
          html: emailShell(
            `New enquiry for ${business.name}`,
            [
              row("Name", data.name),
              row("Phone", data.phone),
              row("Email", data.email),
              row("Service", data.service),
              row("Best time", data.preferred_time),
              data.message
                ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;white-space:pre-line;">${data.message}</p>`
                : "",
              `<p style="margin:24px 0 0;font-size:14px;color:#64748b;">Reply to this email to answer them directly.</p>`,
            ].join(""),
          ),
        });
      }
    } catch (mailError) {
      console.error("Lead notification failed", mailError);
    }

    return { ok: true };
  });
