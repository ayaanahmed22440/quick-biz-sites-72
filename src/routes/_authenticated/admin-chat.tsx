import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin-chat")({
  head: () => ({
    meta: [
      { title: "Client chat — WebWarheads" },
      { name: "description", content: "Live conversations with WebWarheads clients." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminChatPage,
});

const KEY = ["admin-chat"] as const;

function AdminChatPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [staffId, setStaffId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setStaffId(data.user?.id ?? null));
  }, []);

  const inbox = useQuery({
    queryKey: KEY,
    enabled: Boolean(workspace?.isStaff),
    refetchInterval: 5000,
    queryFn: async () => {
      const [{ data: tickets, error }, { data: businesses }, { data: messages }] =
        await Promise.all([
          supabase
            .from("support_tickets")
            .select("id, subject, business_id, status, created_at")
            .order("created_at", { ascending: false })
            .limit(100),
          supabase.from("businesses").select("id, name, email").limit(300),
          supabase
            .from("ticket_messages")
            .select("id, ticket_id, business_id, body, author_id, created_at")
            .eq("is_internal", false)
            .order("created_at", { ascending: true })
            .limit(1000),
        ]);
      if (error) throw error;
      return {
        tickets: tickets ?? [],
        businesses: businesses ?? [],
        messages: messages ?? [],
      };
    },
  });

  const send = useMutation({
    mutationFn: async ({ ticketId, businessId }: { ticketId: string; businessId: string }) => {
      const body = reply.trim();
      if (body.length < 2) throw new Error("Write a reply first.");
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        business_id: businessId,
        author_id: staffId,
        body: body.slice(0, 4000),
      });
      if (error) throw error;
      await supabase.from("support_tickets").update({ status: "pending" }).eq("id", ticketId);
    },
    onSuccess: () => {
      setReply("");
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send that reply"),
  });

  const messagesForActive = (inbox.data?.messages ?? []).filter((m) => m.ticket_id === activeTicket);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messagesForActive.length, activeTicket]);

  if (isLoading) return <LoadingBlock rows={4} />;
  if (!workspace?.isStaff) {
    return (
      <>
        <PageHeader title="Client chat" />
        <EmptyState title="Not available" description="This area is for the WebWarheads team." />
      </>
    );
  }
  if (inbox.isLoading) return <LoadingBlock rows={4} />;
  if (inbox.isError) return <ErrorBlock />;

  const data = inbox.data!;
  const businessById = new Map(data.businesses.map((b) => [b.id, b]));
  const lastByTicket = new Map<string, { body: string; created_at: string }>();
  for (const m of data.messages) lastByTicket.set(m.ticket_id, m);

  const conversations = [...data.tickets].sort((a, b) => {
    const at = lastByTicket.get(a.id)?.created_at ?? a.created_at;
    const bt = lastByTicket.get(b.id)?.created_at ?? b.created_at;
    return bt.localeCompare(at);
  });

  const active = conversations.find((t) => t.id === activeTicket) ?? null;

  return (
    <>
      <PageHeader
        title="Client chat"
        description="Every message a client sends lands here. Replies appear in their chat window within a few seconds."
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="When a client starts a chat you'll see it here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="max-h-[32rem] space-y-1.5 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {conversations.map((t) => {
              const business = businessById.get(t.business_id);
              const last = lastByTicket.get(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTicket(t.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition",
                    activeTicket === t.id ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {business?.name ?? "Unknown client"}
                    </span>
                    <Badge variant={t.status === "open" ? "default" : "secondary"}>{t.status}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {last?.body ?? t.subject}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-[24rem] flex-col rounded-xl border border-border bg-card">
            {active ? (
              <>
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">
                    {businessById.get(active.business_id)?.name ?? "Client"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {businessById.get(active.business_id)?.email ?? active.subject}
                  </p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                  {messagesForActive.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No messages in this thread yet.</p>
                  ) : (
                    messagesForActive.map((m) => {
                      const mine = m.author_id === staffId;
                      return (
                        <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                              mine ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="border-t border-border p-3">
                  <Textarea
                    rows={2}
                    value={reply}
                    placeholder="Type your reply…"
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send.mutate({ ticketId: active.id, businessId: active.business_id });
                      }
                    }}
                  />
                  <Button
                    className="mt-2"
                    disabled={send.isPending}
                    onClick={() =>
                      send.mutate({ ticketId: active.id, businessId: active.business_id })
                    }
                  >
                    {send.isPending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                Pick a conversation on the left.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
