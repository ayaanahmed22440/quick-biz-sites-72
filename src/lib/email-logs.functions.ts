import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailLogRow = {
  timestamp: string;
  recipient: string;
  event: string;
  status: string | null;
};

export type EmailLogResult = {
  rows: EmailLogRow[];
  historyStartsAt: string | null;
  /** Set when the email service could not be reached (e.g. domain not verified yet). */
  problem: string | null;
};

/** Recent delivery events for every email the platform sends. Staff only. */
export const getEmailLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailLogResult> => {
    const { data: isStaff } = await context.supabase.rpc("is_platform_staff", {
      _user_id: context.userId,
    });
    if (!isStaff) throw new Error("Forbidden");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { rows: [], historyStartsAt: null, problem: "Email service is not configured yet." };
    }

    try {
      const { listEmailLogs } = await import("@lovable.dev/email-js");
      const result = await listEmailLogs({ limit: 100 }, { apiKey });
      return {
        rows: result.data.map((e) => ({
          timestamp: e.timestamp,
          recipient: e.recipient,
          event: e.event_type,
          status: e.status ?? null,
        })),
        historyStartsAt: result.history_starts_at ?? null,
        problem: null,
      };
    } catch (error) {
      return {
        rows: [],
        historyStartsAt: null,
        problem:
          error instanceof Error
            ? error.message
            : "Could not read the email log right now.",
      };
    }
  });
