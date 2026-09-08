import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getEmailPreviews } from "@/lib/email-previews.functions";
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
    </div>
  );
}
