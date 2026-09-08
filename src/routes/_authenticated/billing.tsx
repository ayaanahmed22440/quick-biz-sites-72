import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PLAN_COPY, planCopy, isYearly, yearlyPrice } from "@/lib/plans";
import { LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

      <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
        <h2 className="text-sm font-semibold">Checkout is being rebuilt</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Online payment is temporarily unavailable while we set up a new payment system. Your site
          and account are unaffected — contact us and we'll get you started manually.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_COPY.map((plan) => {
          const planId = period === "yearly" ? `${plan.id}_yearly` : plan.id;
          const isCurrent = subscription?.plan_id === planId;
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-6",
                plan.recommended ? "border-accent" : "border-border",
              )}
            >
              {plan.recommended ? (
                <span className="mb-3 inline-flex w-fit rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  Most businesses pick this
                </span>
              ) : null}
              <h3 className="text-base font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold">
                ${period === "yearly" ? yearlyPrice(plan.price) : plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  {period === "yearly" ? "/year" : "/month"}
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Button variant="outline" className="w-full" disabled>
                  {isCurrent ? "Your current plan" : "Checkout coming soon"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Questions about billing? <Link to="/support" className="text-accent hover:underline">Contact support</Link>.
      </p>
    </>
  );
}
