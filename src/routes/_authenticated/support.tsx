import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { can } from "@/lib/plans";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support — WebWarheads" },
      { name: "description", content: "Get help from the WebWarheads team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportPage,
});

const schema = z.object({
  subject: z.string().trim().min(4, "Give your request a short subject").max(140),
  body: z.string().trim().min(10, "Tell us what you need in a bit more detail").max(4000),
});

function SupportPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const tickets = useQuery({
    queryKey: ["tickets", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, status, priority, created_at")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <LoadingBlock rows={3} />;
  if (!businessId) {
    return (
      <>
        <PageHeader title="Support" />
        <EmptyState
          title="Add your business first"
          description="Once your business is set up you can raise support requests here."
        />
      </>
    );
  }
  if (tickets.isError) return <ErrorBlock />;

  const priority = can(workspace!.entitlements, "priority_support") ? "priority" : "normal";

  async function submit() {
    const parsed = schema.safeParse({ subject, body });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      business_id: businessId!,
      created_by: workspace!.userId,
      subject: parsed.data.subject,
      body: parsed.data.body,
      priority,
    });
    setSending(false);
    if (error) {
      toast.error("We couldn't send that. Please try again.");
      return;
    }
    setSubject("");
    setBody("");
    toast.success("Support request sent");
    await queryClient.invalidateQueries({ queryKey: ["tickets", businessId] });
  }

  const rows = tickets.data ?? [];

  return (
    <>
      <PageHeader
        title="Support"
        description={
          priority === "priority"
            ? "You're on the priority queue — we answer your requests first."
            : "Send us a message and we'll get back to you by email."
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="space-y-5">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              maxLength={140}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5"
            />
            {errors["subject"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["subject"]}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="body">What do you need?</Label>
            <Textarea
              id="body"
              rows={5}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1.5"
            />
            {errors["body"] ? (
              <p className="mt-1 text-xs text-destructive">{errors["body"]}</p>
            ) : null}
          </div>
          <Button onClick={submit} disabled={sending}>
            {sending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Your requests</h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">You haven't sent any requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="font-medium">{t.subject}</span>
                <Badge variant="secondary">{t.status}</Badge>
                {t.priority === "priority" ? <Badge>Priority</Badge> : null}
                <span className="ml-auto text-sm text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
