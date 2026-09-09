import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteCustomer } from "@/lib/admin.functions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
const ADMIN_KEY = ["admin-overview"] as const;

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function AdminPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const deleteCustomerFn = useServerFn(deleteCustomer);
  const [search, setSearch] = useState("");
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const admin = useQuery({
    queryKey: ADMIN_KEY,
    enabled: Boolean(workspace?.isStaff),
    queryFn: async () => {
      const [businesses, subscriptions, plans, tickets, messages, websites, leads] =
        await Promise.all([
          supabase
            .from("businesses")
            .select(
              "id, name, slug, city, state, email, phone, niche, onboarding_completed, created_at, suspended",
            )
            .order("created_at", { ascending: false })
            .limit(300),
          supabase
            .from("subscriptions")
            .select(
              "business_id, plan_id, status, current_period_end, cancel_at_period_end, created_at, last_payment_failed_at",
            ),
          supabase.from("plans").select("id, name, price_cents"),
          supabase
            .from("support_tickets")
            .select("id, subject, body, status, priority, business_id, created_at")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("contact_messages")
            .select("id, name, email, business_name, message, handled, created_at")
            .order("created_at", { ascending: false })
            .limit(25),
          supabase.from("websites").select("id, business_id, status, published_at"),
          supabase.from("leads").select("id, business_id, created_at").limit(1000),
        ]);
      return {
        businesses: businesses.data ?? [],
        subscriptions: subscriptions.data ?? [],
        plans: plans.data ?? [],
        tickets: tickets.data ?? [],
        messages: messages.data ?? [],
        websites: websites.data ?? [],
        leads: leads.data ?? [],
      };
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ADMIN_KEY });

  const setSuspended = useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      const { error } = await supabase.from("businesses").update({ suspended }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void refresh();
      toast.success("Client updated");
    },
    onError: () => toast.error("That change didn't save"),
  });

  const setSiteStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "published" | "unpublished" }) => {
      const { error } = await supabase
        .from("websites")
        .update({
          status,
          ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void refresh();
      toast.success("Website updated");
    },
    onError: () => toast.error("That change didn't save"),
  });

  const deleteSite = useMutation({
    mutationFn: async (websiteId: string) => {
      await supabase.from("website_customizations").delete().eq("website_id", websiteId);
      const { error } = await supabase.from("websites").delete().eq("id", websiteId);
      if (error) throw error;
    },
    onSuccess: () => {
      void refresh();
      toast.success("Website deleted");
    },
    onError: () => toast.error("Could not delete that website"),
  });

  const removeCustomer = useMutation({
    mutationFn: (businessId: string) => deleteCustomerFn({ data: { businessId } }),
    onSuccess: (result) => {
      void refresh();
      toast.success(
        result.accountRemoved
          ? "Customer and their sign-in account were deleted"
          : "Customer data deleted",
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete that customer"),
  });

  const setTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "resolved" }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
  });

  const sendReply = useMutation({
    mutationFn: async ({ ticketId, businessId }: { ticketId: string; businessId: string }) => {
      if (reply.trim().length < 2) throw new Error("Write a reply first.");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        business_id: businessId,
        author_id: userData.user?.id ?? null,
        body: reply.trim().slice(0, 4000),
      });
      if (error) throw error;
      await supabase.from("support_tickets").update({ status: "pending" }).eq("id", ticketId);
    },
    onSuccess: () => {
      setReply("");
      setOpenTicket(null);
      void refresh();
      toast.success("Reply sent");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send that reply"),
  });

  const markHandled = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ handled: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
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
  const siteByBusiness = new Map(data.websites.map((w) => [w.business_id, w]));

  const leadsByBusiness = new Map<string, number>();
  for (const l of data.leads) {
    leadsByBusiness.set(l.business_id, (leadsByBusiness.get(l.business_id) ?? 0) + 1);
  }
  const openTicketsByBusiness = new Map<string, number>();
  for (const t of data.tickets) {
    if (t.status === "open" || t.status === "pending") {
      openTicketsByBusiness.set(t.business_id, (openTicketsByBusiness.get(t.business_id) ?? 0) + 1);
    }
  }

  /** Monthly value of a plan; yearly plans spread across twelve months. */
  function monthlyCents(planId: string) {
    const plan = planById.get(planId);
    if (!plan) return 0;
    return planId.endsWith("_yearly") ? Math.round(plan.price_cents / 12) : plan.price_cents;
  }

  const term = search.trim().toLowerCase();
  const customers = data.businesses
    .map((b) => {
      const sub = subByBusiness.get(b.id);
      const mrr = sub && ACTIVE_STATUSES.includes(sub.status) ? monthlyCents(sub.plan_id) : 0;
      const monthsActive = sub
        ? Math.max(1, Math.round((now - new Date(sub.created_at).getTime()) / MONTH_MS))
        : 0;
      return {
        business: b,
        sub,
        site: siteByBusiness.get(b.id),
        mrr,
        monthsActive,
        ltv: sub ? monthlyCents(sub.plan_id) * monthsActive : 0,
      };
    })
    .sort((a, b) => b.mrr - a.mrr || b.ltv - a.ltv);

  const filtered = term
    ? customers.filter((c) =>
        [c.business.name, c.business.city, c.business.email, c.business.slug]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      )
    : customers;

  const paying = customers.filter((c) => c.mrr > 0);
  const mrr = paying.reduce((sum, c) => sum + c.mrr, 0);
  const totalLtv = customers.reduce((sum, c) => sum + c.ltv, 0);
  const arpu = paying.length ? Math.round(mrr / paying.length) : 0;
  const pastDue = customers.filter((c) => c.sub?.status === "past_due");
  const cancelling = customers.filter((c) => c.sub?.cancel_at_period_end);
  const live = data.websites.filter((w) => w.status === "published").length;
  const newThisMonth = customers.filter(
    (c) => now - new Date(c.business.created_at).getTime() < MONTH_MS,
  ).length;

  const renewals = customers
    .filter((c) => c.sub?.current_period_end)
    .map((c) => ({ ...c, renewsAt: new Date(c.sub!.current_period_end!) }))
    .filter((c) => c.renewsAt.getTime() > now - 3 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.renewsAt.getTime() - b.renewsAt.getTime())
    .slice(0, 12);

  const openTickets = data.tickets.filter((t) => t.status === "open" || t.status === "pending");
  const newMessages = data.messages.filter((m) => !m.handled);

  const stats = [
    { label: "MRR", value: money(mrr), note: `${paying.length} paying clients` },
    { label: "Annual run rate", value: money(mrr * 12), note: "MRR × 12" },
    { label: "Billed to date", value: money(totalLtv), note: "Across all clients" },
    { label: "Avg per client", value: money(arpu), note: "Each month" },
  ];

  const counters = [
    { label: "Clients", value: data.businesses.length, note: `${newThisMonth} new this month` },
    { label: "Live websites", value: live, note: `${data.businesses.length - live} not live` },
    { label: "Payment failed", value: pastDue.length, note: "Chase first" },
    { label: "Cancelling", value: cancelling.length, note: "Ends at period end" },
    { label: "Open tickets", value: openTickets.length, note: "Needs a reply" },
    { label: "New enquiries", value: newMessages.length, note: "From the website" },
  ];

  return (
    <>
      <PageHeader
        title="Admin panel"
        description="Revenue, clients, their websites and support — with the controls to act on them."
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

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1.5 text-xl font-bold">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="renewals">Revenue &amp; renewals</TabsTrigger>
          <TabsTrigger value="support">Support ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="enquiries">Enquiries ({newMessages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search clients by name, town or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Link
              to="/admin-templates"
              className="ml-auto text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Website templates →
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead>Renews</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-sm text-muted-foreground">
                      No clients match that search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(({ business: b, sub, site, mrr: m, ltv, monthsActive }) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-medium">
                          {b.name}
                          {b.suspended ? (
                            <Badge variant="destructive" className="ml-2">
                              Suspended
                            </Badge>
                          ) : null}
                          {!b.onboarding_completed ? (
                            <Badge variant="secondary" className="ml-2">
                              Setting up
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[b.city, b.state].filter(Boolean).join(", ") || "—"} · {b.email ?? "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {sub ? (
                          <>
                            {planById.get(sub.plan_id)?.name ?? sub.plan_id}
                            <Badge
                              variant={
                                sub.status === "past_due" || sub.status === "canceled"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="ml-2"
                            >
                              {sub.cancel_at_period_end ? "cancelling" : sub.status}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-muted-foreground">No plan</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {site ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={site.status === "published" ? "default" : "secondary"}>
                              {site.status}
                            </Badge>
                            {site.status === "published" ? (
                              <a
                                className="text-xs underline"
                                href={`/${b.slug}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                view
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not started</span>
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
                      <TableCell className="text-right text-sm">
                        {leadsByBusiness.get(b.id) ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" variant="secondary" asChild>
                            <Link to="/admin-site/$businessId" params={{ businessId: b.id }}>
                              Edit site
                            </Link>
                          </Button>
                          {site ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={setSiteStatus.isPending}
                              onClick={() =>
                                setSiteStatus.mutate({
                                  id: site.id,
                                  status:
                                    site.status === "published" ? "unpublished" : "published",
                                })
                              }
                            >
                              {site.status === "published" ? "Take offline" : "Put live"}
                            </Button>
                          ) : null}
                          {site ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={deleteSite.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete the website for ${b.name}? This cannot be undone.`,
                                  )
                                ) {
                                  deleteSite.mutate(site.id);
                                }
                              }}
                            >
                              Delete site
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant={b.suspended ? "outline" : "ghost"}
                            disabled={setSuspended.isPending}
                            onClick={() =>
                              setSuspended.mutate({ id: b.id, suspended: !b.suspended })
                            }
                          >
                            {b.suspended ? "Restore" : "Suspend"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={removeCustomer.isPending}
                            onClick={() => {
                              const typed = window.prompt(
                                `This permanently deletes ${b.name} — website, media, leads, support history and their sign-in account. Type the business name to confirm.`,
                              );
                              if (typed === null) return;
                              if (typed.trim().toLowerCase() !== b.name.trim().toLowerCase()) {
                                toast.error("Name didn't match — nothing was deleted");
                                return;
                              }
                              removeCustomer.mutate(b.id);
                            }}
                          >
                            Delete customer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="renewals">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold">Upcoming renewals</h2>
            {renewals.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No renewals scheduled yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {renewals.map((r) => {
                  const days = Math.round((r.renewsAt.getTime() - now) / (1000 * 60 * 60 * 24));
                  return (
                    <li key={r.business.id} className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{r.business.name}</span>
                      <span className="text-muted-foreground">
                        {planById.get(r.sub!.plan_id)?.name ?? r.sub!.plan_id}
                      </span>
                      <span className="ml-auto whitespace-nowrap text-muted-foreground">
                        {r.renewsAt.toLocaleDateString()}
                        {days >= 0 ? ` · in ${days}d` : " · overdue"}
                      </span>
                      {r.sub!.cancel_at_period_end ? (
                        <Badge variant="destructive">Ending</Badge>
                      ) : null}
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
        </TabsContent>

        <TabsContent value="support">
          <div className="space-y-3">
            {data.tickets.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No tickets yet.
              </p>
            ) : (
              data.tickets.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{t.subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {businessById.get(t.business_id)?.name ?? ""}
                    </span>
                    {t.priority === "priority" ? <Badge>Priority</Badge> : null}
                    <Badge variant="secondary" className="ml-auto">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t.body}</p>
                  {openTicket === t.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        rows={4}
                        placeholder="Write your reply…"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={sendReply.isPending}
                          onClick={() =>
                            sendReply.mutate({ ticketId: t.id, businessId: t.business_id })
                          }
                        >
                          Send reply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setOpenTicket(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpenTicket(t.id);
                          setReply("");
                        }}
                      >
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setTicketStatus.mutate({
                            id: t.id,
                            status: t.status === "resolved" ? "open" : "resolved",
                          })
                        }
                      >
                        {t.status === "resolved" ? "Reopen" : "Mark resolved"}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="enquiries">
          <div className="space-y-3">
            {data.messages.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No enquiries yet.
              </p>
            ) : (
              data.messages.map((m) => (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="font-medium">
                    {m.name} {m.business_name ? `— ${m.business_name}` : ""}
                    {!m.handled ? (
                      <Badge variant="secondary" className="ml-2">
                        New
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">{m.email}</p>
                  <p className="mt-1.5 whitespace-pre-line">{m.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${m.email}`}>Email back</a>
                    </Button>
                    {!m.handled ? (
                      <Button size="sm" variant="ghost" onClick={() => markHandled.mutate(m.id)}>
                        Mark handled
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
