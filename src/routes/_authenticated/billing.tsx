import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PLAN_COPY, planCopy, isYearly, yearlyPrice } from "@/lib/plans";
import { syncWhopSubscription } from "@/lib/whop-sync.functions";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  plan: z.enum(["basic", "seo", "premium"]).optional(),
  checkout: z.enum(["success"]).optional(),
});

export const Route = createFileRoute("/_authenticated/billing")({
  validateSearch: searchSchema,
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
  const { checkout } = Route.useSearch();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  // Coming back from checkout: sync straight from the Whop API (webhooks can
  // lag), then keep refetching briefly in case the webhook refines the state.
  useEffect(() => {
    if (checkout !== "success") return;
    let tries = 0;
    const tick = () => {
      tries += 1;
      void syncWhopSubscription().finally(() => void refetch());
      if (tries >= 6) clearInterval(timer);
    };
    void syncWhopSubscription().finally(() => void refetch());
    const timer = setInterval(tick, 3000);
    return () => clearInterval(timer);
  }, [checkout, refetch]);

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price_cents, whop_checkout_url, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || plans.isLoading) return <LoadingBlock rows={3} />;
  if (plans.isError) return <ErrorBlock />;

  const subscription = workspace?.subscription;
  const current = planCopy(subscription?.plan_id);
  const businessId = workspace?.business?.id;
  const checkoutById = new Map((plans.data ?? []).map((p) => [p.id, p.whop_checkout_url]));
  const anyCheckout = (plans.data ?? []).some((p) => p.whop_checkout_url);

  /**
   * Whop reads `metadata[business_id]` back to us on the membership webhook, and
   * `redirect_url` brings the customer straight back here after paying.
   */
  function checkoutUrl(planId: string) {
    const base = checkoutById.get(planId);
    if (!base) return null;
    const params = new URLSearchParams();
    if (businessId) params.set("metadata[business_id]", businessId);
    if (typeof window !== "undefined") {
      params.set("redirect_url", `${window.location.origin}/billing?checkout=success`);
    }
    const query = params.toString();
    if (!query) return base;
    return `${base}${base.includes("?") ? "&" : "?"}${query}`;
  }

  return (
    <>
      <PageHeader
        title="Billing"
        description="Plans are billed through Whop. Cancel any time."
      />

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

      {checkout === "success" && !subscription ? (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-5">
          <h2 className="text-sm font-semibold">Confirming your payment…</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This usually takes a few seconds. This page checks automatically — you can also refresh
            it below.
          </p>
        </div>
      ) : null}

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
            You don't have an active plan yet. Choose one below to get your website built.
          </p>
        )}
      </div>

      {!anyCheckout ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
          <h2 className="text-sm font-semibold">Checkout isn't connected yet</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            WebWarheads billing runs through Whop. Once the Whop plans and API credentials are added
            to this account, the buttons below take customers straight to a real checkout. Nothing
            here charges anyone until then.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_COPY.map((plan) => {
          const planId = period === "yearly" ? `${plan.id}_yearly` : plan.id;
          const isCurrent = subscription?.plan_id === planId;
          const url = checkoutUrl(planId);
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
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Your current plan
                  </Button>
                ) : url ? (
                  <Button
                    asChild
                    className={cn(
                      "w-full",
                      plan.recommended && "bg-accent text-accent-foreground hover:bg-accent/90",
                    )}
                  >
                    <a href={url} rel="noreferrer">
                      {subscription ? "Switch to this plan" : "Choose this plan"}
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Checkout not connected
                  </Button>
                )}
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
