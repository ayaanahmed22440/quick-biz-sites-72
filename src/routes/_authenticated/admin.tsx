import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — WebWarheads" },
      { name: "description", content: "WebWarheads internal administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];
const MONTH_MS = 1000 * 60 * 60 * 24 * 30.44;

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function AdminPage() {
  const { data: workspace, isLoading } = useWorkspace();

  const admin = useQuery({
    queryKey: ["admin-overview"],
    enabled: Boolean(workspace?.isStaff),
    queryFn: async () => {
      const [businesses, subscriptions, plans, tickets, messages] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, city, state, onboarding_completed, created_at, suspended")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("subscriptions")
          .select(
            "business_id, plan_id, status, current_period_end, cancel_at_period_end, created_at, last_payment_failed_at",
          ),
        supabase.from("plans").select("id, name, price_cents"),
        supabase
          .from("support_tickets")
          .select("id, subject, status, priority, business_id, created_at")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("contact_messages")
          .select("id, name, email, business_name, message, handled, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      return {
        businesses: businesses.data ?? [],
        subscriptions: subscriptions.data ?? [],
        plans: plans.data ?? [],
        tickets: tickets.data ?? [],
        messages: messages.data ?? [],
      };
    },
  });

  if (isLoading) return <LoadingBlock rows={4} />;

  if (!workspace?.isStaff) {
    return (
      <>
        <PageHeader title="Admin" />
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-base font-semibold">Not available</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This area is for the WebWarheads team only.
          </p>
        </div>
      </>
    );
  }

  if (admin.isLoading) return <LoadingBlock rows={4} />;
  if (admin.isError) return <ErrorBlock />;

  const data = admin.data!;
  const now = Date.now();
  const planById = new Map(data.plans.map((p) => [p.id, p]));
  const businessById = new Map(data.businesses.map((b) => [b.id, b]));
  const subByBusiness = new Map(data.subscriptions.map((s) => [s.business_id, s]));
  const openTicketsByBusiness = new Map<string, number>();
  for (const t of data.tickets) {
    if (t.status === "open" || t.status === "pending") {
      openTicketsByBusiness.set(t.business_id, (openTicketsByBusiness.get(t.business_id) ?? 0) + 1);
    }
  }

  /** Monthly recurring value of a plan (yearly plans divided across 12 months). */
  function monthlyCents(planId: string) {
    const plan = planById.get(planId);
    if (!plan) return 0;
    return planId.endsWith("_yearly") ? Math.round(plan.price_cents / 12) : plan.price_cents;
  }

  const customers = data.businesses
    .map((b) => {
      const sub = subByBusiness.get(b.id);
      const mrr = sub && ACTIVE_STATUSES.includes(sub.status) ? monthlyCents(sub.plan_id) : 0;
      const monthsActive = sub
        ? Math.max(1, Math.round((now - new Date(sub.created_at).getTime()) / MONTH_MS))
        : 0;
      const ltv = sub ? monthlyCents(sub.plan_id) * monthsActive : 0;
      return { business: b, sub, mrr, monthsActive, ltv };
    })
    .sort((a, b) => b.mrr - a.mrr || b.ltv - a.ltv);

  const paying = customers.filter((c) => c.mrr > 0);
  const mrr = paying.reduce((sum, c) => sum + c.mrr, 0);
  const totalLtv = customers.reduce((sum, c) => sum + c.ltv, 0);
  const arpu = paying.length ? Math.round(mrr / paying.length) : 0;
  const pastDue = customers.filter((c) => c.sub?.status === "past_due");
  const cancelling = customers.filter((c) => c.sub?.cancel_at_period_end);

  const renewals = customers
    .filter((c) => c.sub?.current_period_end)
    .map((c) => ({ ...c, renewsAt: new Date(c.sub!.current_period_end!) }))
    .filter((c) => c.renewsAt.getTime() > now - 3 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.renewsAt.getTime() - b.renewsAt.getTime())
    .slice(0, 10);

  const openTickets = data.tickets.filter((t) => t.status === "open" || t.status === "pending");

  const stats = [
    { label: "MRR", value: money(mrr), note: `${paying.length} paying customers` },
    { label: "Annual run rate", value: money(mrr * 12), note: "MRR × 12" },
    { label: "Total LTV to date", value: money(totalLtv), note: "Billed across all customers" },
    { label: "Avg per customer", value: money(arpu), note: "Monthly average" },
  ];

  return (
    <>
      <PageHeader
        title="Admin panel"
        description="Revenue, customers, renewals and support in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total clients", value: data.businesses.length },
          { label: "Payment failed", value: pastDue.length },
          { label: "Cancelling", value: cancelling.length },
          { label: "Open tickets", value: openTickets.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-sm font-semibold">Clients</h2>
          <Link
            to="/admin-templates"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Website templates →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead>Renews</TableHead>
                <TableHead>Tickets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-muted-foreground">
                    No clients yet.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map(({ business: b, sub, mrr: m, ltv, monthsActive }) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.name}
                      {b.suspended ? (
                        <Badge variant="destructive" className="ml-2">
                          Suspended
                        </Badge>
                      ) : null}
                      {!b.onboarding_completed ? (
                        <Badge variant="secondary" className="ml-2">
                          Onboarding
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[b.city, b.state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub ? (planById.get(sub.plan_id)?.name ?? sub.plan_id) : "No plan"}
                    </TableCell>
                    <TableCell>
                      {sub ? (
                        <Badge
                          variant={
                            sub.status === "past_due" || sub.status === "canceled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {sub.cancel_at_period_end ? "cancelling" : sub.status}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{m ? money(m) : "—"}</TableCell>
                    <TableCell className="text-right text-sm">
                      {ltv ? (
                        <span title={`${monthsActive} month(s) billed`}>{money(ltv)}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {sub?.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {openTicketsByBusiness.get(b.id) ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Upcoming renewals</h2>
          {renewals.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No renewals scheduled yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {renewals.map((r) => {
                const days = Math.round((r.renewsAt.getTime() - now) / (1000 * 60 * 60 * 24));
                return (
                  <li key={r.business.id} className="flex items-center gap-2">
                    <span className="truncate font-medium">{r.business.name}</span>
                    <span className="text-muted-foreground">
                      {planById.get(r.sub!.plan_id)?.name ?? r.sub!.plan_id}
                    </span>
                    <span className="ml-auto whitespace-nowrap text-muted-foreground">
                      {r.renewsAt.toLocaleDateString()}
                      {days >= 0 ? ` · in ${days}d` : " · overdue"}
                    </span>
                    {r.sub!.cancel_at_period_end ? <Badge variant="destructive">Ending</Badge> : null}
                  </li>
                );
              })}
            </ul>
          )}
          {pastDue.length > 0 ? (
            <p className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {pastDue.length} client(s) have a failed payment — chase these first.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Support tickets</h2>
          {data.tickets.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.tickets.slice(0, 12).map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <span className="truncate font-medium">{t.subject}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {businessById.get(t.business_id)?.name ?? ""}
                  </span>
                  {t.priority === "priority" ? <Badge>Priority</Badge> : null}
                  <Badge variant="secondary" className="ml-auto">
                    {t.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">New enquiries</h2>
        {data.messages.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {data.messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">
                  {m.name} {m.business_name ? `— ${m.business_name}` : ""}
                  {!m.handled ? (
                    <Badge variant="secondary" className="ml-2">
                      New
                    </Badge>
                  ) : null}
                </p>
                <p className="text-muted-foreground">{m.email}</p>
                <p className="mt-1.5">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
