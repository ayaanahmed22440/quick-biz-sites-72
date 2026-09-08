import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const supabase = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const staticPaths = ["/", "/pricing", "/how-it-works", "/contact", "/terms", "/privacy"];
        const { data } = await supabase.rpc("list_published_site_slugs");
        const slugs = (data as { slug: string; published_at: string | null }[] | null) ?? [];

        const urls = [
          ...staticPaths.map((p) => `<url><loc>${origin}${p}</loc></url>`),
          ...slugs.map(
            (s) =>
              `<url><loc>${origin}/s/${s.slug}</loc>${s.published_at ? `<lastmod>${new Date(s.published_at).toISOString()}</lastmod>` : ""}</url>`,
          ),
        ].join("");

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          { headers: { "content-type": "application/xml; charset=utf-8" } },
        );
      },
    },
  },
});
