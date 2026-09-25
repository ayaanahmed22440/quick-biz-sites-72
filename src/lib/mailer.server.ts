/**
 * Outgoing mail transport for every WebWarheads notification.
 *
 * Messages go out through Lovable's managed email service on the verified
 * sender domain, which signs each message (SPF/DKIM/DMARC) so it lands in the
 * inbox rather than spam. Every attempt is recorded in `public.sent_emails`
 * so staff can see what went out from the admin area.
 *
 * Server-only: never import this from a component.
 */
import { EmailAPIError, sendLovableEmail } from "@lovable.dev/email-js";
import { htmlToText } from "@/lib/gmail.server";

const SITE_NAME = "WebWarheads";
/** Verified delegated subdomain — used for sender lookup. */
const SENDER_DOMAIN = "notify.webwarheads.com";
/** Domain shown in the From: header. */
const FROM_DOMAIN = "webwarheads.com";
/** Where customer replies land unless a sender sets its own Reply-To. */
const DEFAULT_REPLY_TO = "support@webwarheads.com";

export type MailResult = { sent: boolean; error?: string; suppressed?: boolean };

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Short machine label, e.g. "new_lead" — shown in the admin email log. */
  purpose: string;
  businessId?: string | null;
  /** Dedupes retries of the same logical send. */
  idempotencyKey?: string;
}): Promise<MailResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];

  let result: MailResult;
  if (!apiKey) {
    result = { sent: false, error: "Email sending is not configured yet." };
  } else {
    try {
      await sendLovableEmail(
        {
          to: opts.to,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: opts.subject,
          html: opts.html,
          text: htmlToText(opts.html),
          purpose: "transactional",
          label: opts.purpose,
          idempotency_key: opts.idempotencyKey || crypto.randomUUID(),
          reply_to: opts.replyTo || DEFAULT_REPLY_TO,
        },
        { apiKey },
      );
      result = { sent: true };
    } catch (error) {
      if (error instanceof EmailAPIError && error.code === "recipient_suppressed") {
        // The recipient bounced, complained or unsubscribed earlier. Expected.
        result = { sent: false, suppressed: true, error: "Recipient has opted out." };
      } else {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[email:${opts.purpose}] send failed`, message);
        result = { sent: false, error: message };
      }
    }
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sent_emails").insert({
      business_id: opts.businessId ?? null,
      recipient: opts.to,
      subject: opts.subject,
      purpose: opts.purpose,
      status: result.sent ? "sent" : result.suppressed ? "suppressed" : "failed",
      error: result.error ?? null,
    });
  } catch (error) {
    console.error("Could not record the email log entry", error);
  }

  return result;
}
