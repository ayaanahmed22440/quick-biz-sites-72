import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { checkSubscriptionState, getCheckoutReturn } from "@/lib/billing.functions";
import { workspaceQueryKey } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";

const search = z.object({ session: z.string().optional() });

export const Route = createFileRoute("/_authenticated/billing_/return")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Confirming your payment — WebWarheads" },
      { name: "description", content: "Confirming your WebWarheads subscription." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingReturnPage,
});

type State = "checking" | "active" | "slow";

function BillingReturnPage() {
  const { session } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkState = useServerFn(checkSubscriptionState);
  const getReturn = useServerFn(getCheckoutReturn);
  const [state, setState] = useState<State>("checking");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      let destination = "/dashboard";
      if (session) {
        try {
          const info = await getReturn({ data: { sessionId: session } });
          destination = info.returnPath;
        } catch {
          /* fall back to the dashboard */
        }
      }

      // The backend decides whether the payment landed — never the redirect.
      for (let attempt = 0; attempt < 15 && !cancelled; attempt += 1) {
        try {
          const result = await checkState({});
          if (result.active) {
            await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
            if (cancelled) return;
            // Primary ad conversion — a payment the backend has confirmed.
            trackPaidSignup(session ? { id: session } : {});
            setState("active");
            setTimeout(() => void navigate({ to: destination }), 1200);
            return;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (!cancelled) setState("slow");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [session, checkState, getReturn, navigate, queryClient]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-xl border border-border bg-card p-10 text-center">
      {state === "checking" ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <h1 className="mt-4 text-lg font-semibold">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This usually takes a few seconds. Please don't close this page — nothing you built is
            lost.
          </p>
        </>
      ) : state === "active" ? (
        <>
          <CheckCircle2 className="h-8 w-8 text-success" />
          <h1 className="mt-4 text-lg font-semibold">You're all set</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your plan is active. Taking you back to where you left off…
          </p>
        </>
      ) : (
        <>
          <AlertTriangle className="h-8 w-8 text-warning" />
          <h1 className="mt-4 text-lg font-semibold">Payment is still being confirmed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your work is saved. If you completed payment, this normally clears within a minute —
            refresh your billing page to check again.
          </p>
          <Button className="mt-5" onClick={() => void navigate({ to: "/billing" })}>
            Go to billing
          </Button>
        </>
      )}
    </div>
  );
}
