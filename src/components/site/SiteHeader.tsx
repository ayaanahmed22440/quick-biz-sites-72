import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/contact", label: "Talk to us" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <header>
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-muted text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {loading ? null : user ? (
              <Button asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Start building
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                {user ? (
                  <Button
                    asChild
                    onClick={() => setOpen(false)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Link to="/dashboard">Go to dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Link to="/auth">Log in</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => setOpen(false)}
                    >
                      <Link to="/auth" search={{ mode: "signup" }}>
                        Start building
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </div>
  );
}
