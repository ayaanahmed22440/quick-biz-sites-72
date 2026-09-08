import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PLAN_COPY, planCopy, isYearly, yearlyPrice } from "@/lib/plans";
import { confirmWhopCheckout, createWhopCheckout } from "@/lib/whop-checkout.functions";
import { WhopCheckoutPanel } from "@/components/billing/WhopCheckoutPanel";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  plan: z.enum(["basic", "seo", "premium"]).optional(),
  status: z.enum(["success", "error"]).optional(),
  state_id: z.string().max(200).optional(),
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
  const { status } = Route.useSearch();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [checkoutSession, setCheckoutSession] = useState<{ sessionId: string; email: string } | null>(null);
  const [checkoutState, setCheckoutState] = useState<"idle" | "starting" | "confirming" | "confirmed" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price_cents, whop_plan_id, is_active")
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
  const configuredPlans = new Set((plans.data ?? []).filter((plan) => plan.whop_plan_id).map((plan) => plan.id));
  const anyCheckout = configuredPlans.size > 0;

  async function openCheckout(planId: "basic" | "seo" | "premium" | "basic_yearly" | "seo_yearly" | "premium_yearly") {
    setCheckoutState("starting");
    setCheckoutError(null);
    try {
      const result = await createWhopCheckout({
        data: { planId, returnUrl: `${window.location.origin}/billing` },
      });
      setCheckoutSession(result);
      setCheckoutState("idle");
    } catch (error) {
      setCheckoutState("error");
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not be started.");
    }
  }

  async function completeCheckout(receiptId: string | undefined) {
    setCheckoutState("confirming");
    setCheckoutError(null);
    if (!receiptId) {
      setCheckoutState("error");
      setCheckoutError("Payment completed, but confirmation is still pending. Please refresh shortly.");
      return;
    }
    try {
      const result = await confirmWhopCheckout({ data: { receiptId } });
      if (!result.confirmed) throw new Error("Payment is still being confirmed. Please wait a moment and refresh.");
      await refetch();
      setCheckoutState("confirmed");
      setTimeout(() => setCheckoutSession(null), 1000);
    } catch (error) {
      setCheckoutState("error");
      setCheckoutError(error instanceof Error ? error.message : "Payment confirmation is still pending.");
    }
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

      {status === "success" && !subscription ? (
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
            WebWarheads billing runs through Whop. Checkout will be available when the active plans
            are connected.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_COPY.map((plan) => {
          const planId = (period === "yearly" ? `${plan.id}_yearly` : plan.id) as
            | "basic"
            | "seo"
            | "premium"
            | "basic_yearly"
            | "seo_yearly"
            | "premium_yearly";
          const isCurrent = subscription?.plan_id === planId;
          const isConfigured = configuredPlans.has(planId);
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
                ) : isConfigured ? (
                  <Button
                    type="button"
                    onClick={() => void openCheckout(planId)}
                    disabled={checkoutState === "starting"}
                    className={cn(
                      "w-full",
                      plan.recommended && "bg-accent text-accent-foreground hover:bg-accent/90",
                    )}
                  >
                    {checkoutState === "starting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {subscription ? "Switch to this plan" : "Choose this plan"}
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

      {checkoutError && !checkoutSession ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {checkoutError}
        </div>
      ) : null}

      <Dialog open={Boolean(checkoutSession)} onOpenChange={(open) => !open && setCheckoutSession(null)}>
        <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Complete your WebWarheads plan</DialogTitle>
            <DialogDescription>Your payment is securely handled by Whop without leaving WebWarheads.</DialogDescription>
          </DialogHeader>
          {checkoutSession ? (
            <WhopCheckoutPanel
              sessionId={checkoutSession.sessionId}
              email={checkoutSession.email}
              returnUrl={`${window.location.origin}/billing`}
              onComplete={(receiptId) => void completeCheckout(receiptId)}
              onError={(message) => {
                setCheckoutState("error");
                setCheckoutError(message);
              }}
            />
          ) : null}
          {checkoutState === "confirming" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
            </div>
          ) : null}
          {checkoutState === "confirmed" ? <p className="text-sm font-medium text-success">Plan activated.</p> : null}
          {checkoutError ? <p className="text-sm text-destructive">{checkoutError}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
