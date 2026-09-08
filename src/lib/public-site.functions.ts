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

export const getPublishedSite = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: site, error } = await supabase.rpc("get_published_site", { p_slug: data.slug });
    if (error) throw new Error(error.message);
    return site as unknown;
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
    const { error } = await supabase.rpc("submit_website_lead", {
      p_slug: data.slug,
      p_name: data.name,
      p_email: data.email || null,
      p_phone: data.phone || null,
      p_service: data.service || null,
      p_preferred_time: data.preferred_time || null,
      p_message: data.message || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
