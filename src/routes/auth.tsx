import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_COPY } from "@/lib/plans";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { AppleIcon } from "@/components/brand/AppleIcon";

const TITLE = "Log in to your WebWarheads account";
const DESCRIPTION =
  "Sign in with a one-time link to manage your business website, leads and subscription.";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).optional(),
  plan: z.enum(["basic", "seo", "premium"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const selectedPlan = PLAN_COPY.find((p) => p.id === search.plan);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    if (!z.string().email().max(255).safeParse(email).success) {
      setError("Enter a valid email address");
      return;
    }

    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (otpError) {
      setError("We couldn't send that link. Please try again in a moment.");
      return;
    }
    setSentTo(email);
  }

  async function handleGoogle() {
    setError(null);
    sessionStorage.setItem("ww:after-login", "/dashboard");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard", replace: true });
  }

  async function handleApple() {
    setError(null);
    sessionStorage.setItem("ww:after-login", "/dashboard");
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Apple sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-7">
          {sentTo ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a sign-in link to {sentTo}. Open it on this device to log in.
              </p>
              <Button variant="link" className="mt-4" onClick={() => setSentTo(null)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight">Log in to WebWarheads</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {selectedPlan
                  ? `You picked the ${selectedPlan.name} plan at $${selectedPlan.price}/month. Log in to continue.`
                  : "Enter your email and we'll send you a one-time sign-in link. No password needed."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    className="mt-1.5"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Sending…" : "Email me a login link"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full gap-2" onClick={handleGoogle}>
                  <GoogleIcon />
                  Google
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={handleApple}>
                  <AppleIcon />
                  Apple
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                New to WebWarheads?{" "}
                <Link to="/onboarding" className="font-medium text-foreground hover:underline">
                  Build your website
                </Link>
              </p>
            </>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              Back to webwarheads.com
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
