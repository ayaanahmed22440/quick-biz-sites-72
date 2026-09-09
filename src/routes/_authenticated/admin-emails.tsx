import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getEmailPreviews } from "@/lib/email-previews.functions";
import { getEmailLog } from "@/lib/email-logs.functions";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin-emails")({
  head: () => ({
    meta: [
      { title: "Email templates — WebWarheads Admin" },
      {
        name: "description",
        content: "Preview every automatic email WebWarheads sends to customers.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEmailsPage,
});

function AdminEmailsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const fetchPreviews = useServerFn(getEmailPreviews);
  const [active, setActive] = useState<string | null>(null);

  const previews = useQuery({
    queryKey: ["email-previews"],
    enabled: Boolean(workspace?.isStaff),
    queryFn: () => fetchPreviews({}),
  });

  if (isLoading) return <LoadingBlock />;
  if (!workspace?.isStaff) {
    return <ErrorBlock message="This area is for WebWarheads staff only." />;
  }

  const items = previews.data ?? [];
  const selected = items.find((i) => i.key === active) ?? items[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email templates"
        description="Every automatic email customers receive, sent from support@webwarheads.com."
      />

      {previews.isLoading ? <LoadingBlock /> : null}
      {previews.isError ? <ErrorBlock message="Could not load the email previews." /> : null}

      {items.length > 0 && selected ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected.key === item.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="block text-sm font-semibold">{item.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{selected.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Subject: {selected.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">support@webwarheads.com</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(selected.html);
                      w.document.close();
                    }
                  }}
                >
                  Open full size
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <iframe
                title={`${selected.name} preview`}
                srcDoc={selected.html}
                className="h-[720px] w-full rounded-md border bg-white"
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <GmailLogSection />
      <EmailLogSection />
    </div>
  );
}

/** Everything sent from the connected Gmail account (lead alerts, notices). */
function GmailLogSection() {
  const sent = useQuery({
    queryKey: ["sent-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sent_emails")
        .select("id, recipient, subject, purpose, status, error, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sent from your Gmail</CardTitle>
        <p className="text-sm text-muted-foreground">
          Lead alerts and notices the platform sent from your connected Google account.
        </p>
      </CardHeader>
      <CardContent>
        {sent.isLoading ? <LoadingBlock rows={3} /> : null}
        {sent.isError ? <ErrorBlock message="Could not load these emails." /> : null}
        {sent.data && sent.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing sent yet. The first website enquiry will show up here.
          </p>
        ) : null}
        {sent.data && sent.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">When</th>
                  <th className="py-2 pr-4 font-semibold">To</th>
                  <th className="py-2 pr-4 font-semibold">Subject</th>
                  <th className="py-2 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody>
                {sent.data.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap py-2 pr-4 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{row.recipient}</td>
                    <td className="py-2 pr-4">{row.subject}</td>
                    <td className="py-2">
                      <Badge variant={row.status === "sent" ? "secondary" : "destructive"}>
                        {row.status === "sent" ? "sent" : "failed"}
                      </Badge>
                      {row.error ? (
                        <span className="ml-2 text-xs text-muted-foreground">{row.error}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmailLogSection() {
  const fetchLog = useServerFn(getEmailLog);
  const log = useQuery({ queryKey: ["email-log"], queryFn: () => fetchLog({}) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Emails sent</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every email the platform has sent recently, and what happened to it.
        </p>
      </CardHeader>
      <CardContent>
        {log.isLoading ? <LoadingBlock rows={3} /> : null}
        {log.isError ? <ErrorBlock message="Could not load the email log." /> : null}
        {log.data?.problem ? (
          <p className="text-sm text-muted-foreground">{log.data.problem}</p>
        ) : null}
        {log.data && !log.data.problem && log.data.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No emails have been sent yet. They appear here as soon as sending is switched on.
          </p>
        ) : null}
        {log.data && log.data.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">When</th>
                  <th className="py-2 pr-4 font-semibold">To</th>
                  <th className="py-2 pr-4 font-semibold">What happened</th>
                  <th className="py-2 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {log.data.rows.map((row, i) => (
                  <tr key={`${row.timestamp}-${i}`} className="border-b last:border-0">
                    <td className="whitespace-nowrap py-2 pr-4 text-muted-foreground">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{row.recipient}</td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant={
                          row.event === "sent"
                            ? "secondary"
                            : row.event === "bounced" ||
                                row.event === "complained" ||
                                row.event === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {row.event}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{row.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
