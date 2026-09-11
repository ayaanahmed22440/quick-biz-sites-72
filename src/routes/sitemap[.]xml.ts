import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://webwarheads.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const staticPaths = [
          "/",
          "/pricing",
          "/how-it-works",
          "/contact",
          "/terms",
          "/privacy",
          "/refund-policy",
          "/cancellation-policy",
        ];

        const { data, error } = await supabase.rpc("list_published_site_slugs");
        if (error) {
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }
        const slugs = (data as { slug: string; published_at: string | null }[] | null) ?? [];

        const escape = (value: string) =>
          value.replace(
            /[&<>"']/g,
            (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
          );

        const urls = [
          ...staticPaths.map((p) => `<url><loc>${escape(BASE_URL + p)}</loc></url>`),
          ...slugs.map(
            (s) =>
              `<url><loc>${escape(`${BASE_URL}/${s.slug}`)}</loc>${
                s.published_at ? `<lastmod>${new Date(s.published_at).toISOString()}</lastmod>` : ""
              }</url>`,
          ),
        ].join("");

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          {
            headers: {
              "content-type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          },
        );
      },
    },
  },
});
