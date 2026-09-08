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

function AdminPage() {
  const { data: workspace, isLoading } = useWorkspace();

  const admin = useQuery({
    queryKey: ["admin-overview"],
    enabled: Boolean(workspace?.isStaff),
    queryFn: async () => {
      const [businesses, subscriptions, tickets, templates, messages] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, city, state, onboarding_completed, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("subscriptions").select("business_id, plan_id, status"),
        supabase
          .from("support_tickets")
          .select("id, subject, status, priority, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("templates").select("id, name, slug, status, niche").order("name"),
        supabase
          .from("contact_messages")
          .select("id, name, email, business_name, message, handled, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      return {
        businesses: businesses.data ?? [],
        subscriptions: subscriptions.data ?? [],
        tickets: tickets.data ?? [],
        templates: templates.data ?? [],
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
  const planByBusiness = new Map(data.subscriptions.map((s) => [s.business_id, s]));
  const activeCount = data.subscriptions.filter((s) =>
    ["active", "trialing", "past_due"].includes(s.status),
  ).length;

  return (
    <>
      <PageHeader title="Admin" description="Customers, subscriptions, templates and support." />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Businesses", value: data.businesses.length },
          { label: "Active subscriptions", value: activeCount },
          { label: "Open tickets", value: data.tickets.filter((t) => t.status === "open").length },
          { label: "New enquiries", value: data.messages.filter((m) => !m.handled).length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Onboarded</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  No businesses yet.
                </TableCell>
              </TableRow>
            ) : (
              data.businesses.map((b) => {
                const sub = planByBusiness.get(b.id);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[b.city, b.state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      {sub ? (
                        <span className="flex items-center gap-2">
                          {sub.plan_id} <Badge variant="secondary">{sub.status}</Badge>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{b.onboarding_completed ? "Yes" : "No"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Templates</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.templates.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground">({t.niche})</span>
                <Badge variant="secondary" className="ml-auto">
                  {t.status}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            New templates must pass human review and be approved before they can be published to
            customers.
          </p>
          <Link
            to="/admin-templates"
            className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            View template previews →
          </Link>
        </div>


        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Latest support tickets</h2>
          {data.tickets.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.tickets.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <span className="truncate font-medium">{t.subject}</span>
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
        <h2 className="text-sm font-semibold">Website enquiries</h2>
        {data.messages.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {data.messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">
                  {m.name} {m.business_name ? `— ${m.business_name}` : ""}
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
