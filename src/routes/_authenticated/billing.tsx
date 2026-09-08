import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PLAN_COPY, planCopy } from "@/lib/plans";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ plan: z.enum(["basic", "seo", "premium"]).optional() });

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
  const { data: workspace, isLoading } = useWorkspace();
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
  const checkoutById = new Map((plans.data ?? []).map((p) => [p.id, p.whop_checkout_url]));
  const anyCheckout = (plans.data ?? []).some((p) => p.whop_checkout_url);

  return (
    <>
      <PageHeader
        title="Billing"
        description="Plans are billed monthly through Whop. Cancel any time."
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Current plan</h2>
        {subscription && current ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold">
              ${current.price}/month — {current.name}
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
          const isCurrent = subscription?.plan_id === plan.id;
          const url = checkoutById.get(plan.id);
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
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
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
