import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  CreditCard,
  Globe,
  Image,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  UserPlus,
  Search,
  Settings,
  Shield,
  LayoutTemplate,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/website", label: "Website", icon: Globe },
  { to: "/business", label: "Business", icon: Building2 },
  { to: "/media", label: "Media", icon: Image },
  { to: "/seo", label: "SEO", icon: Search },
  { to: "/domains", label: "Domains", icon: Globe },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: workspace } = useWorkspace();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    void navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      {workspace?.isStaff ? (
        <>
          <div className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/45">
            WebWarheads
          </div>
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
          <Link
            to="/admin-templates"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
          >
            <LayoutTemplate className="h-4 w-4" />
            Website templates
          </Link>
          <Link
            to="/admin-emails"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
          >
            <Mail className="h-4 w-4" />
            Email templates
          </Link>
          {workspace.isAdmin ? (
            <Link
              to="/admin-team"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
            >
              <UserPlus className="h-4 w-4" />
              Team access
            </Link>
          ) : null}
        </>

      ) : null}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Logo tone="light" />
        </div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-3 text-xs text-sidebar-foreground/60">{workspace?.email}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <Logo />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {open ? (
          <div className="border-b border-sidebar-border bg-sidebar p-3 lg:hidden">
            {nav}
            <Button variant="ghost" className="mt-3 w-full justify-start text-sidebar-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        ) : null}

        <main className={cn("flex-1 px-4 py-8 sm:px-6 lg:px-10")}>
          <div className="mx-auto max-w-5xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
