import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startCheckout } from "@/lib/billing.functions";
import { PLAN_COPY, yearlyPrice } from "@/lib/plans";
import { trackInitiateCheckout } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Plan id currently owned, e.g. "seo" or "seo_yearly". */
  currentPlanId?: string | null;
  /** Where the customer should land after paying. */
  returnPath: string;
  featureCount?: number;
  /** Which business is being paid for. Without it the earliest one is used. */
  businessId?: string | null;
};

export function PlanChooser({
  currentPlanId,
  returnPath,
  featureCount = 5,
  businessId,
}: Props) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [pending, setPending] = useState<string | null>(null);
  const checkout = useServerFn(startCheckout);

  async function choose(planId: string) {
    setPending(planId);
    const copy = PLAN_COPY.find((p) => p.id === planId.replace(/_yearly$/, ""));
    if (copy) {
      trackInitiateCheckout({
        planId,
        value: planId.endsWith("_yearly") ? yearlyPrice(copy.price) : copy.price,
      });
    }
    try {
      const result = await checkout({
        data: { planId, returnPath, ...(businessId ? { businessId } : {}) },
      });
      window.location.href = result.url;
    } catch (error) {
      setPending(null);
      toast.error(
        error instanceof Error ? error.message : "We couldn't open checkout. Please try again.",
      );
    }
  }

  return (
    <div className="@container space-y-4">
      <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Free for {TRIAL_DAYS} days — no charge until {trialEndDate()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your site goes live straight away. We take your card to start the trial, but you won't be
            charged until day {TRIAL_DAYS}. Cancel anytime before then.
          </p>
        </div>
      </div>


      <div className="inline-flex max-w-full flex-wrap rounded-lg border border-border bg-card p-1">


        {(["monthly", "yearly"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )}
          >
            {p === "yearly" ? "Yearly — 2 months free" : "Monthly"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 @2xl:grid-cols-3">
        {PLAN_COPY.map((plan) => {
          const planId = period === "yearly" ? `${plan.id}_yearly` : plan.id;
          const isCurrent = currentPlanId === planId;
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
              <p className="mt-1.5 inline-flex w-fit rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
                {TRIAL_LABEL}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {plan.features.slice(0, featureCount).map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Button
                  className="w-full"
                  variant={plan.recommended ? "default" : "outline"}
                  disabled={isCurrent || pending !== null}
                  onClick={() => void choose(planId)}
                >
                  {pending === planId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening checkout…
                    </>
                  ) : isCurrent ? (
                    "Your current plan"
                  ) : (
                    `Start ${TRIAL_DAYS}-day free trial`
                  )}
                </Button>
              </div>

            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Secure payment handled by Polar. $0 today — your first payment is on day {TRIAL_DAYS}.
        Cancel any time from Billing; your website and content stay yours.
      </p>

    </div>
  );
}
