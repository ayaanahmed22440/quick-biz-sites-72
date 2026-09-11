import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { notifySupportMessage } from "@/lib/notify.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const CHAT_SUBJECT = "Live chat";

type ChatMessage = {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
};

/** Floating chat for customers. Messages land in the WebWarheads admin inbox. */
export function SupportChat({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const notifyTeam = useServerFn(notifySupportMessage);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const key = ["support-chat", businessId] as const;

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const chat = useQuery({
    queryKey: key,
    enabled: open,
    refetchInterval: open ? 5000 : false,
    queryFn: async () => {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("business_id", businessId)
        .eq("subject", CHAT_SUBJECT)
        .maybeSingle();
      if (!ticket) return { ticketId: null as string | null, messages: [] as ChatMessage[] };
      const { data: messages, error } = await supabase
        .from("ticket_messages")
        .select("id, body, author_id, created_at")
        .eq("ticket_id", ticket.id)
        .eq("is_internal", false)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return { ticketId: ticket.id, messages: (messages ?? []) as ChatMessage[] };
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [chat.data?.messages.length, open]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Session expired");

      let ticketId = chat.data?.ticketId ?? null;
      if (!ticketId) {
        const { data: created, error } = await supabase
          .from("support_tickets")
          .insert({
            business_id: businessId,
            subject: CHAT_SUBJECT,
            body,
            created_by: uid,
            status: "open",
          })
          .select("id")
          .single();
        if (error) throw error;
        ticketId = created.id;
      } else {
        await supabase.from("support_tickets").update({ status: "open" }).eq("id", ticketId);
      }

      const { error: msgError } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        business_id: businessId,
        author_id: uid,
        body: body.slice(0, 4000),
      });
      if (msgError) throw msgError;

      // Ping the team by email; a mail failure must not lose the message.
      try {
        await notifyTeam({ data: { businessId, message: body.slice(0, 4000) } });
      } catch (mailError) {
        console.error("Support alert email failed", mailError);
      }
    },
    onSuccess: () => {
      setText("");
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  function submit() {
    const body = text.trim();
    if (body.length < 2 || send.isPending) return;
    send.mutate(body);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 sm:bottom-5"
      >
        <MessageCircle className="h-4 w-4" />
        Chat with us
      </button>
    );
  }

  const messages = chat.data?.messages ?? [];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[min(30rem,80vh)] w-[min(22rem,92vw)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">WebWarheads support</p>
          <p className="text-xs text-muted-foreground">We usually reply within a few hours.</p>
        </div>
        <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {chat.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Ask us anything — about your website, your plan or your domain.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.author_id === userId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
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
          value={text}
          placeholder="Type your message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button className="mt-2 w-full" onClick={submit} disabled={send.isPending}>
          <Send className="mr-2 h-4 w-4" />
          {send.isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
