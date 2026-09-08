import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        In the next build
      </span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function UpgradePrompt({
  title,
  description,
  plan = "seo",
}: {
  title: string;
  description: string;
  plan?: "seo" | "premium";
}) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-8">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Lock className="h-4 w-4" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90">
        <Link to="/billing" search={{ plan }}>
          See upgrade options
        </Link>
      </Button>
    </div>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ErrorBlock({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-sm font-semibold text-destructive">Something didn't load</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {message ?? "Please refresh the page. If it keeps happening, contact support."}
      </p>
    </div>
  );
}
