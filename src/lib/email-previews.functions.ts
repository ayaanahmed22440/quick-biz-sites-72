import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EmailPreviewItem } from "@/lib/email-previews.server";

export type { EmailPreviewItem };

export const getEmailPreviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailPreviewItem[]> => {
    const { renderEmailPreviews } = await import("@/lib/email-previews.server");
    return renderEmailPreviews();
  },
);

/** Staff-only: sends any template to any inbox so we can check deliverability. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; to: string }) => {
    const to = String(input.to ?? "").trim().toLowerCase();
    const key = String(input.key ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) throw new Error("Enter a valid email address.");
    if (!key) throw new Error("Pick a template first.");
    return { key, to };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff, error: roleError } = await (context.supabase as never as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: boolean; error: unknown }>;
    }).rpc("is_platform_staff", { _user_id: context.userId });
    if (roleError) throw roleError;
    if (!isStaff) throw new Error("Staff access required");

    const { renderEmailPreviews } = await import("@/lib/email-previews.server");
    const template = (await renderEmailPreviews()).find((item) => item.key === data.key);
    if (!template) throw new Error("That template no longer exists.");

    const { sendGmail } = await import("@/lib/gmail.server");
    const result = await sendGmail({
      to: data.to,
      subject: `[Test] ${template.subject}`,
      html: template.html,
      purpose: "test_send",
      businessId: null,
    });

    if (!result?.sent) {
      throw new Error(
        (result as { error?: string } | undefined)?.error ?? "The email could not be sent.",
      );
    }
    return { sent: true as const, to: data.to };
  });
