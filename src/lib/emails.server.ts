/**
 * Every WebWarheads email in one place, so they all look the same and all get
 * logged. Server-only: never import this from a component.
 *
 * Sending never throws — a mail problem must not break the action that caused
 * it. Failures land in the admin email log instead.
 */
import { sendGmail, emailShell } from "@/lib/gmail.server";

const SITE_URL = "https://webwarheads.com";
export const ADMIN_ALERT_EMAIL = process.env["ADMIN_ALERT_EMAIL"] ?? "admin@webwarheads.com";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function paragraph(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;">${text}</p>`;
}

function button(label: string, href: string) {
  return `<p style="margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background:#1f6feb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px;">${label}</a></p>`;
}

function detail(label: string, value?: string | null) {
  return value
    ? `<p style="margin:0 0 8px;font-size:15px;"><strong>${label}:</strong> ${escape(value)}</p>`
    : "";
}

type SendArgs = {
  to: string;
  subject: string;
  title: string;
  body: string;
  purpose: string;
  businessId?: string | null;
  replyTo?: string;
};

async function send({ to, subject, title, body, purpose, businessId, replyTo }: SendArgs) {
  try {
    return await sendGmail({
      to,
      subject,
      purpose,
      businessId: businessId ?? null,
      ...(replyTo ? { replyTo } : {}),
      html: emailShell(title, body),
    });
  } catch (error) {
    console.error(`[email:${purpose}] failed`, error);
    return { sent: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/* ------------------------------------------------------------------ owner */

export function sendWelcomeEmail(opts: { to: string; businessId: string; businessName: string }) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "welcome",
    subject: `Your website is ready to look at, ${opts.businessName}`,
    title: "Welcome to WebWarheads",
    body: [
      paragraph(
        `We've built the first version of the site for <strong>${escape(opts.businessName)}</strong> from the details you gave us.`,
      ),
      paragraph(
        "Open the editor to change any wording or photo. Nothing goes live until you press publish.",
      ),
      button("Open my editor", `${SITE_URL}/website`),
      paragraph(
        `<span style="color:#64748b;font-size:14px;">Stuck on anything? Just reply to this email.</span>`,
      ),
    ].join(""),
  });
}

export function sendSitePublishedEmail(opts: {
  to: string;
  businessId: string;
  businessName: string;
  slug: string;
}) {
  const url = `${SITE_URL}/${opts.slug}`;
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "site_published",
    subject: "Your website is live",
    title: "You're live",
    body: [
      paragraph(`${escape(opts.businessName)} is now online at:`),
      paragraph(`<a href="${url}" style="color:#1f6feb;font-weight:700;">${url}</a>`),
      paragraph(
        "Put that link on your van, your Facebook page and your Google profile — it's how customers will find and message you.",
      ),
      button("View my website", url),
      paragraph(
        `Want your own name instead, like yourbusiness.com? <a href="${SITE_URL}/connect-domain" style="color:#1f6feb;">Here's how to set that up</a>.`,
      ),
    ].join(""),
  });
}

export function sendNewLeadEmail(opts: {
  to: string;
  businessId: string;
  businessName: string;
  lead: {
    name: string;
    email?: string;
    phone?: string;
    service?: string;
    preferred_time?: string;
    message?: string;
  };
}) {
  const { lead } = opts;
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "new_lead",
    ...(lead.email ? { replyTo: lead.email } : {}),
    subject: `New enquiry from ${lead.name}`,
    title: `New enquiry for ${escape(opts.businessName)}`,
    body: [
      detail("Name", lead.name),
      detail("Phone", lead.phone),
      detail("Email", lead.email),
      detail("Service", lead.service),
      detail("Best time", lead.preferred_time),
      lead.message
        ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;white-space:pre-line;">${escape(lead.message)}</p>`
        : "",
      lead.phone
        ? button("Call them now", `tel:${lead.phone.replace(/[^+\d]/g, "")}`)
        : lead.email
          ? button("Reply by email", `mailto:${lead.email}`)
          : "",
      paragraph(
        `<span style="color:#64748b;font-size:14px;">Replying to this email answers them directly. Every enquiry is also saved in your dashboard.</span>`,
      ),
    ].join(""),
  });
}

export function sendPaymentReceivedEmail(opts: {
  to: string;
  businessId: string;
  planName: string;
}) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "payment_received",
    subject: "Payment received — your plan is active",
    title: "Thanks, you're all set",
    body: [
      paragraph(`Your <strong>${escape(opts.planName)}</strong> plan is now active.`),
      paragraph("Everything on your plan is switched on straight away."),
      button("Go to my dashboard", `${SITE_URL}/dashboard`),
    ].join(""),
  });
}

export function sendPaymentFailedEmail(opts: { to: string; businessId: string }) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "payment_failed",
    subject: "Your last payment didn't go through",
    title: "We couldn't take your payment",
    body: [
      paragraph(
        "Your card was declined. This is usually an expired card or a bank block — it happens all the time.",
      ),
      paragraph("Your website stays online while you sort it out. Nothing has been deleted."),
      button("Update my payment details", `${SITE_URL}/billing`),
    ].join(""),
  });
}

export function sendAccessPausedEmail(opts: { to: string; businessId: string }) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "access_paused",
    subject: "Your WebWarheads plan has ended",
    title: "Your plan has ended",
    body: [
      paragraph(
        "Your subscription is no longer active, so your website has been taken offline for now.",
      ),
      paragraph(
        "Everything is saved exactly as you left it — your pages, photos and enquiries. Start your plan again and it comes straight back.",
      ),
      button("Restart my plan", `${SITE_URL}/billing`),
    ].join(""),
  });
}

export function sendRenewalReminderEmail(opts: {
  to: string;
  businessId: string;
  planName: string;
  renewsOn: string;
}) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "renewal_reminder",
    subject: `Your plan renews on ${opts.renewsOn}`,
    title: "A quick heads-up",
    body: [
      paragraph(
        `Your <strong>${escape(opts.planName)}</strong> plan renews on <strong>${escape(opts.renewsOn)}</strong>. No action needed if you're happy.`,
      ),
      button("Manage my plan", `${SITE_URL}/billing`),
    ].join(""),
  });
}

export function sendDomainLiveEmail(opts: {
  to: string;
  businessId: string;
  domain: string;
  secure: boolean;
}) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "domain_live",
    subject: `${opts.domain} is now pointing at your website`,
    title: "Your domain is connected",
    body: [
      paragraph(
        `Your website now answers at <strong>${escape(opts.domain)}</strong>${opts.secure ? " with the padlock switched on" : ""}.`,
      ),
      button("Open my site", `https://${opts.domain}`),
      paragraph(
        `<span style="color:#64748b;font-size:14px;">Keep auto-renew turned on at your domain provider so the name never lapses.</span>`,
      ),
    ].join(""),
  });
}

export function sendDomainReminderEmail(opts: {
  to: string;
  businessId: string;
  domain: string;
}) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "domain_reminder",
    subject: `${opts.domain} isn't connected yet`,
    title: "Two records still to add",
    body: [
      paragraph(
        `We're still waiting on the DNS records for <strong>${escape(opts.domain)}</strong>. Until they're added, your site keeps working on its WebWarheads address.`,
      ),
      button("Show me the records", `${SITE_URL}/domains`),
      paragraph(
        `Need a hand? <a href="${SITE_URL}/connect-domain" style="color:#1f6feb;">Read the step-by-step guide</a> or reply to this email.`,
      ),
    ].join(""),
  });
}

export function sendSupportReplyEmail(opts: {
  to: string;
  businessId: string;
  message: string;
}) {
  return send({
    to: opts.to,
    businessId: opts.businessId,
    purpose: "support_reply",
    subject: "Reply from WebWarheads support",
    title: "We've replied to your message",
    body: [
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;white-space:pre-line;">${escape(opts.message)}</p>`,
      button("Continue the conversation", `${SITE_URL}/support`),
    ].join(""),
  });
}

/* ------------------------------------------------------------------ admin */

function adminNote(opts: {
  subject: string;
  title: string;
  lines: string[];
  purpose: string;
  businessId?: string | null;
}) {
  return send({
    to: ADMIN_ALERT_EMAIL,
    subject: opts.subject,
    title: opts.title,
    purpose: opts.purpose,
    businessId: opts.businessId ?? null,
    body: opts.lines.map((line) => paragraph(line)).join(""),
  });
}

export function adminNewCustomer(opts: {
  businessId: string;
  businessName: string;
  email?: string | null;
  niche?: string | null;
}) {
  return adminNote({
    purpose: "admin_new_customer",
    businessId: opts.businessId,
    subject: `New signup: ${opts.businessName}`,
    title: "New customer",
    lines: [
      `<strong>${escape(opts.businessName)}</strong>`,
      opts.email ? escape(opts.email) : "No email on file",
      opts.niche ? `Niche: ${escape(opts.niche)}` : "",
    ].filter(Boolean),
  });
}

export function adminPaymentEvent(opts: {
  businessId: string;
  businessName: string;
  outcome: "received" | "failed" | "ended";
  planName?: string;
}) {
  const label =
    opts.outcome === "received"
      ? "Payment received"
      : opts.outcome === "failed"
        ? "Payment failed"
        : "Subscription ended";
  return adminNote({
    purpose: `admin_payment_${opts.outcome}`,
    businessId: opts.businessId,
    subject: `${label}: ${opts.businessName}`,
    title: label,
    lines: [
      `<strong>${escape(opts.businessName)}</strong>`,
      opts.planName ? `Plan: ${escape(opts.planName)}` : "",
    ].filter(Boolean),
  });
}

export function adminSupportMessage(opts: {
  businessId: string;
  businessName: string;
  message: string;
}) {
  return adminNote({
    purpose: "admin_support_message",
    businessId: opts.businessId,
    subject: `Support message from ${opts.businessName}`,
    title: "New support message",
    lines: [`<strong>${escape(opts.businessName)}</strong>`, escape(opts.message)],
  });
}
