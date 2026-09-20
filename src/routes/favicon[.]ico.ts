import { createFileRoute } from "@tanstack/react-router";

const PLATFORM_FAVICON = "/favicon-96.png";

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

export const Route = createFileRoute("/favicon.ico")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const host = (
          request.headers.get("x-forwarded-host") ??
          request.headers.get("host") ??
          url.host
        )
          .toLowerCase()
          .trim()
          .split(":")[0];

        const fallback = (cacheSeconds: number) =>
          new Response(null, {
            status: 302,
            headers: {
              location: PLATFORM_FAVICON,
              "cache-control": `public, max-age=${cacheSeconds}`,
            },
          });

        if (!host || isPlatformHost(host)) return fallback(86400);

        // Customer domain: serve their own logo as the tab icon when they
        // have one, so their site never shows the WebWarheads mark.
        try {
          const bare = host.replace(/^www\./, "");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: domainRow } = await supabaseAdmin
            .from("domains")
            .select("business_id")
            .eq("domain", bare)
            .limit(1);
          const businessId = domainRow?.[0]?.business_id;
          if (!businessId) return fallback(300);

          const { data: business } = await supabaseAdmin
            .from("businesses")
            .select("logo_url, suspended")
            .eq("id", businessId)
            .maybeSingle();
          const logo = business?.logo_url;
          if (!business || business.suspended || !logo) return fallback(300);

          const location = logo.startsWith("/") ? `${url.origin}${logo}` : logo;
          return new Response(null, {
            status: 302,
            headers: {
              location,
              "cache-control": "public, max-age=3600",
            },
          });
        } catch {
          return fallback(300);
        }
      },
    },
  },
});
