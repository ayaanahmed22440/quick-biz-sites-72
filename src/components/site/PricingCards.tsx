import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PLAN_COPY } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLAN_COPY.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col rounded-xl border bg-card p-6",
            plan.recommended ? "border-accent shadow-sm ring-1 ring-accent/20" : "border-border",
          )}
        >
          {plan.recommended ? (
            <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Most businesses pick this
            </span>
          ) : null}

          <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.headline}</p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              ${plan.price}
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">No setup fee. Cancel anytime.</p>

          <Button
            asChild
            className={cn(
              "mt-6",
              plan.recommended && "bg-accent text-accent-foreground hover:bg-accent/90",
            )}
            variant={plan.recommended ? "default" : "outline"}
          >
            <Link to="/auth" search={{ mode: "signup", plan: plan.id }}>
              Choose {plan.name}
            </Link>
          </Button>

          {compact ? null : <p className="mt-6 text-sm text-foreground">{plan.who}</p>}

          <ul className="mt-5 space-y-2.5 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
