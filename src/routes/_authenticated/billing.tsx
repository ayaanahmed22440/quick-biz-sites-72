import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { planCopy, isYearly, yearlyPrice } from "@/lib/plans";
import { LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { PlanChooser } from "@/components/billing/PlanChooser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing — WebWarheads" },
      { name: "description", content: "Your WebWarheads plan and billing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { data: workspace, isLoading, refetch, isFetching } = useWorkspace();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  if (isLoading) return <LoadingBlock rows={3} />;

  const subscription = workspace?.subscription;
  const current = planCopy(subscription?.plan_id);

  return (
    <>
      <PageHeader title="Billing" description="Your WebWarheads plan. Cancel any time." />

      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {(["monthly", "yearly"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )}
          >
            {p === "yearly" ? "Yearly — 2 months free" : "Monthly"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Current plan</h2>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Checking…" : "Refresh"}
          </Button>
        </div>
        {subscription && current ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold">
              ${isYearly(subscription.plan_id) ? yearlyPrice(current.price) : current.price}
              {isYearly(subscription.plan_id) ? "/year" : "/month"} — {current.name}
            </span>
            <Badge variant="secondary">{subscription.status}</Badge>
            {subscription.current_period_end ? (
              <span className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end ? "Ends" : "Renews"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have an active plan yet.
          </p>
        )}
      </div>

      {subscription?.status === "past_due" ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
          <h2 className="text-sm font-semibold">There's a problem with your last payment</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your website stays online while we retry. Update your payment details on Whop, or
            choose a plan again below to fix it.
          </p>
        </div>
      ) : null}

      <PlanChooser currentPlanId={subscription?.plan_id ?? null} returnPath="/billing" />

      <p className="text-sm text-muted-foreground">
        Questions about billing? <Link to="/support" className="text-accent hover:underline">Contact support</Link>.
      </p>
    </>
  );
}
