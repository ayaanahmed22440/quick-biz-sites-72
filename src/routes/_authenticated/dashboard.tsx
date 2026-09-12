import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, Star } from "lucide-react";

const GOOGLE_REVIEW_URL = "https://g.page/r/CaiWtKMXkWg7EAI/review";
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

  // A WebWarheads team account has no website of its own — send them to the
  // admin centre instead of the customer onboarding.
  if (!business && data.isStaff) {
    return (
      <>
        <PageHeader
          title="WebWarheads team"
          description="You're signed in with a team account."
        />
        <EmptyState
          title="Head to the admin centre"
          description="Revenue, clients, websites, templates and support all live in the admin area."
          action={
            <Button asChild>
              <Link to="/admin">
                Open admin <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </>
    );
  }

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

  const isPublished = data.website?.status === "published";
  const liveUrl = `/${business.slug}`;
  const checklist = [
    { done: true, label: "Account created" },
    { done: business.onboarding_completed, label: "Business details added", to: "/onboarding" },
    { done: Boolean(data.subscription), label: "Plan chosen", to: "/billing" },
    { done: isPublished, label: "Website published", to: "/website" },
    { done: data.hasActiveDomain, label: "Domain connected", to: "/domains" },
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
          <p className="mt-2 text-lg font-semibold">
            {isPublished ? "Your website is live" : "Draft — not live yet"}
          </p>
          {isPublished ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              Open live website <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link to="/website" className="mt-1 inline-block text-sm text-accent hover:underline">
              Open website editor
            </Link>
          )}
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
          <p className="mt-2 text-lg font-semibold">{data.leadCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.leadCount === 1 ? "Customer enquiry received." : "Customer enquiries received."}
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

      {isPublished ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Star className="mt-0.5 h-5 w-5 shrink-0 fill-accent text-accent" />
            <div>
              <p className="font-semibold">Enjoying your new website?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                A quick Google review helps other local business owners find us — it takes under a
                minute.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="sm:ml-auto">
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer">
              Leave us a review <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      ) : null}
    </>
  );
}
