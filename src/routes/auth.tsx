import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_COPY } from "@/lib/plans";
import { GoogleIcon } from "@/components/brand/GoogleIcon";

const TITLE = "Log in or create your WebWarheads account";
const DESCRIPTION =
  "Sign in to manage your business website, leads and subscription, or create a new WebWarheads account.";

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

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});




function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(search.mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

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

    if (mode === "forgot") {
      if (!z.string().email().safeParse(email).success) {
        setError("Enter a valid email address");
        return;
      }
      setBusy(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setCheckEmail(true);
      return;
    }

    const parsed = credentials.safeParse({ email, password: form.get("password") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setBusy(true);
    if (mode === "signup") {
      const fullName = String(form.get("full_name") ?? "").trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setCheckEmail(true);
        return;
      }
      toast.success("Account created");
      void navigate({ to: "/onboarding", replace: true });
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (signInError) {
      setError("That email and password combination didn't work.");
      return;
    }
    void navigate({ to: "/dashboard", replace: true });
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

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-7">
          {checkEmail ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a link to your inbox. Open it to continue.
              </p>
              <Button
                variant="link"
                className="mt-4"
                onClick={() => {
                  setCheckEmail(false);
                  setMode("login");
                }}
              >
                Back to log in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight">
                {mode === "signup"
                  ? "Create your account"
                  : mode === "forgot"
                    ? "Reset your password"
                    : "Log in to WebWarheads"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signup"
                  ? selectedPlan
                    ? `You picked the ${selectedPlan.name} plan at $${selectedPlan.price}/month. Create your account to continue.`
                    : "A few details and you can start building your website."
                  : mode === "forgot"
                    ? "We'll email you a link to set a new password."
                    : "Manage your website, leads and subscription."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                {mode === "signup" ? (
                  <div>
                    <Label htmlFor="full_name">Your name</Label>
                    <Input id="full_name" name="full_name" maxLength={100} className="mt-1.5" />
                  </div>
                ) : null}

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

                {mode !== "forgot" ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "login" ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setMode("forgot")}
                        >
                          Forgot password?
                        </button>
                      ) : null}
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      maxLength={72}
                      className="mt-1.5"
                    />
                  </div>
                ) : null}

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button type="submit" disabled={busy} className="w-full">
                  {busy
                    ? "Working…"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Log in"}
                </Button>
              </form>

              {mode !== "forgot" ? (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    or
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={handleGoogle}>
                    <GoogleIcon />
                    Continue with Google
                  </Button>
                </>
              ) : null}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-foreground hover:underline"
                      onClick={() => setMode("login")}
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    New to WebWarheads?{" "}
                    <button
                      type="button"
                      className="font-medium text-foreground hover:underline"
                      onClick={() => setMode("signup")}
                    >
                      Create an account
                    </button>
                  </>
                )}
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
