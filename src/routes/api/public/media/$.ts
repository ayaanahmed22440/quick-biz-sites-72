import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves an uploaded logo or photo from the private media store.
 *
 * The bucket itself stays private (uploads are locked to the owning business by
 * storage policies). Anything a customer chooses to put on their published
 * website has to be readable by the public, so this route streams the object
 * with a stable, non-expiring URL and long cache headers.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = String((params as { _splat?: string })._splat ?? "");
        // Only <business-id>/<file> paths, no traversal.
        if (!/^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/i.test(path)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("business-media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
