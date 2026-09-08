import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { planCopy } from "@/lib/plans";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — WebWarheads" },
      { name: "description", content: "Your website status, plan and next steps." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, isError } = useWorkspace();

  if (isLoading) return <LoadingBlock rows={4} />;
  if (isError || !data) return <ErrorBlock />;

  const business = data.business;
  const plan = planCopy(data.subscription?.plan_id);

  if (!business) {
    return (
      <>
        <PageHeader
          title={`Welcome${data.fullName ? `, ${data.fullName.split(" ")[0]}` : ""}`}
          description="One step before we can build your website."
        />
        <EmptyState
          title="Tell us about your business"
          description="Your business name, services, phone number and the areas you cover. It takes about five minutes and nothing is technical."
          action={
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/onboarding">
                Start onboarding <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const checklist = [
    { done: true, label: "Account created" },
    { done: business.onboarding_completed, label: "Business details added", to: "/onboarding" },
    { done: Boolean(data.subscription), label: "Plan chosen", to: "/billing" },
    { done: false, label: "Website published", to: "/website" },
    { done: false, label: "Domain connected", to: "/domains" },
  ] as const;

  return (
    <>
      <PageHeader
        title={business.name}
        description={
          [business.city, business.state].filter(Boolean).join(", ") || "Your WebWarheads account"
        }
        action={
          <Button asChild variant="outline">
            <Link to="/business">Edit business details</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Website
          </p>
          <p className="mt-2 text-lg font-semibold">Not published yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The editor and template arrive in the next build.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plan
          </p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
            {plan ? `$${plan.price} ${plan.name}` : "No plan yet"}
            {data.subscription ? (
              <Badge variant="secondary">{data.subscription.status}</Badge>
            ) : null}
          </p>
          <Link to="/billing" className="mt-1 inline-block text-sm text-accent hover:underline">
            {plan ? "Manage plan" : "Choose a plan"}
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Leads
          </p>
          <p className="mt-2 text-lg font-semibold">0</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enquiries appear here once your site is live.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Getting live</h2>
        <ul className="mt-4 space-y-3">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                {item.label}
              </span>
              {!item.done && "to" in item && item.to ? (
                <Link to={item.to} className="ml-auto text-sm text-accent hover:underline">
                  Continue
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
