/**
 * Sends mail from the connected Gmail account through the Lovable connector
 * gateway, and records every attempt in `public.sent_emails` so staff can see
 * what went out from the admin area.
 *
 * Server-only: never import this from a component.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const b64 = (value: string) =>
  btoa(Array.from(new TextEncoder().encode(value), (b) => String.fromCharCode(b)).join(""));

/** RFC 2047 encodes headers that contain non-ASCII characters. */
const header = (value: string) =>
  /^[\x00-\x7F]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`;

/** Strips tags so every message carries a readable plain-text alternative. */
export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function rawMessage(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  text?: string;
}) {
  const boundary = `ww_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const text = opts.text ?? htmlToText(opts.html);
  const lines = [
    `To: ${opts.to}`,
    `Subject: ${header(opts.subject)}`,
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}`] : []),
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "",
    opts.html,
    "",
    `--${boundary}--`,
    "",
  ];
  return b64(lines.join("\r\n")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type GmailSendResult = { sent: boolean; error?: string };

export async function sendGmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Optional plain-text alternative; generated from the HTML when omitted. */
  text?: string;
  /** Short machine label, e.g. "new_lead" — shown in the admin email log. */
  purpose: string;
  businessId?: string | null;
}): Promise<GmailSendResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAIL_API_KEY"];

  let result: GmailSendResult;
  if (!lovableKey || !connectionKey) {
    result = { sent: false, error: "Gmail is not connected yet." };
  } else {
    try {
      const response = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": connectionKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage(opts) }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error(`Gmail send failed [${response.status}]: ${body}`);
        result = { sent: false, error: `[${response.status}] ${body.slice(0, 400)}` };
      } else {
        result = { sent: true };
      }
    } catch (error) {
      result = { sent: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sent_emails").insert({
      business_id: opts.businessId ?? null,
      recipient: opts.to,
      subject: opts.subject,
      purpose: opts.purpose,
      status: result.sent ? "sent" : "failed",
      error: result.error ?? null,
    });
  } catch (error) {
    console.error("Could not record the email log entry", error);
  }

  return result;
}

/** Shared shell so every message looks like it came from WebWarheads. */
export function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#1f6feb;">WebWarheads</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${title}</h1>
    ${bodyHtml}
    <hr style="margin:32px 0 16px;border:none;border-top:1px solid #e2e8f0;" />
    <p style="margin:0;font-size:12px;color:#64748b;">Sent by WebWarheads.</p>
  </div>
</body></html>`;
}
