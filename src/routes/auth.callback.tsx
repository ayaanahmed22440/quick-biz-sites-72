import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — WebWarheads" },
      { name: "description", content: "Completing your WebWarheads sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          const target = sessionStorage.getItem("ww:after-login");
          sessionStorage.removeItem("ww:after-login");
          void navigate({ to: target === "/admin" ? "/admin" : "/dashboard", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!cancelled) void navigate({ to: "/auth", replace: true });
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
