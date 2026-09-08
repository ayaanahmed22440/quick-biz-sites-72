import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm text-navy-foreground/70">
            WebWarheads builds and runs websites for small and local service businesses — for a
            monthly price, with no developer and no setup fees.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-navy-foreground/70">
            <li>
              <Link to="/pricing" className="hover:text-navy-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-navy-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-navy-foreground">
                Log in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-navy-foreground/70">
            <li>
              <Link to="/contact" className="hover:text-navy-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-navy-foreground">
                Terms
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-navy-foreground">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-navy-foreground/60 sm:px-6">
          © {new Date().getFullYear()} WebWarheads. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
