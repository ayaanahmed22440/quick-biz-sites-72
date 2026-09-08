import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/brand/GoogleIcon";

const TITLE = "WebWarheads staff log in";
const DESCRIPTION = "Log in to the WebWarheads staff and admin area.";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const staff = (roles ?? []).some((r) => r.role === "admin" || r.role === "staff");
    if (!staff) {
      setError("That account doesn't have staff access.");
      void navigate({ to: "/dashboard", replace: true });
      return;
    }
    void navigate({ to: "/admin", replace: true });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const parsed = credentials.safeParse({
      email: String(form.get("email") ?? "").trim(),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (signInError) {
      setError("That email and password combination didn't work.");
      return;
    }
    await goToAdmin();
  }

  async function handleGoogle() {
    setError(null);
    sessionStorage.setItem("ww:after-login", "/admin");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setError("Google sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    await goToAdmin();
  }

  return (
    <div className="flex min-h-screen flex-col bg-sidebar">
      <header className="border-b border-sidebar-border px-4 py-4 sm:px-6">
        <Logo tone="light" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-7">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="h-4 w-4" />
            Staff access
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight">Log in to the admin area</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            For the WebWarheads team. Customers should use the normal log in page.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Working…" : "Log in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogle}>
            <GoogleIcon />
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="hover:underline">
              Customer log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
