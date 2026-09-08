import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Zap } from "lucide-react";
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
    <div className="sticky top-0 z-40">
      {/* Announcement strip — gives the top of the page a pulse */}
      <div className="bg-accent text-accent-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span>Cleaning companies: build free, pay only when you publish</span>
        </div>
      </div>

      <header className="border-b border-navy-muted/60 bg-navy text-navy-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo tone="light" />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-navy-foreground/70 transition-colors hover:bg-navy-muted/50 hover:text-navy-foreground"
                activeProps={{ className: "bg-navy-muted/60 text-navy-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {loading ? null : user ? (
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-navy-foreground/80 hover:bg-navy-muted/50 hover:text-navy-foreground"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy-foreground/25 text-navy-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-navy-muted/60 bg-navy md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-navy-foreground/80 hover:bg-navy-muted/50"
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
                      className="border-navy-foreground/25 bg-transparent text-navy-foreground hover:bg-navy-muted/50 hover:text-navy-foreground"
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
