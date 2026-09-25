import { createServerFn } from "@tanstack/react-start";

export type EmailPreviewItem = {
  key: string;
  name: string;
  subject: string;
  description: string;
  group: string;
  html: string;
};

export const getEmailPreviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailPreviewItem[]> => {
    const React = await import("react");
    const { render } = await import("@react-email/render");
    const { SignupEmail } = await import("@/lib/email-templates/signup");
    const { InviteEmail } = await import("@/lib/email-templates/invite");
    const { MagicLinkEmail } = await import("@/lib/email-templates/magic-link");
    const { RecoveryEmail } = await import("@/lib/email-templates/recovery");
    const { EmailChangeEmail } = await import("@/lib/email-templates/email-change");
    const { ReauthenticationEmail } = await import(
      "@/lib/email-templates/reauthentication"
    );
    const emails = await import("@/lib/emails.server");

    const siteName = "WebWarheads";
    const siteUrl = "https://webwarheads.com";
    const recipient = "customer@example.com";
    const url = "https://webwarheads.com/auth/callback?token=example";

    const authItems: Array<Omit<EmailPreviewItem, "html"> & { element: React.ReactElement }> = [
      {
        key: "signup",
        name: "Sign-up confirmation",
        subject: "Confirm your email",
        description: "Sent when someone creates a WebWarheads account.",
        group: "Account & login",
        element: React.createElement(SignupEmail, {
          siteName,
          siteUrl,
          recipient,
          confirmationUrl: url,
        }),
      },
      {
        key: "recovery",
        name: "Password reset",
        subject: "Reset your password",
        description: "Sent when someone asks to reset their password.",
        group: "Account & login",
        element: React.createElement(RecoveryEmail, {
          siteName,
          confirmationUrl: url,
        } as never),
      },
      {
        key: "magiclink",
        name: "Login link",
        subject: "Your login link",
        description: "One-click sign-in link.",
        group: "Account & login",
        element: React.createElement(MagicLinkEmail, {
          siteName,
          confirmationUrl: url,
        } as never),
      },
      {
        key: "invite",
        name: "Invitation",
        subject: "You've been invited",
        description: "Sent when you invite someone to a workspace.",
        group: "Account & login",
        element: React.createElement(InviteEmail, {
          siteName,
          siteUrl,
          confirmationUrl: url,
        } as never),
      },
      {
        key: "email_change",
        name: "Email change",
        subject: "Confirm your new email",
        description: "Sent when a customer changes their email address.",
        group: "Account & login",
        element: React.createElement(EmailChangeEmail, {
          siteName,
          confirmationUrl: url,
          newEmail: "new@example.com",
        } as never),
      },
      {
        key: "reauthentication",
        name: "Verification code",
        subject: "Your verification code",
        description: "One-time code for sensitive account actions.",
        group: "Account & login",
        element: React.createElement(ReauthenticationEmail, {
          siteName,
          token: "123456",
        } as never),
      },
    ];

    const rendered = await Promise.all(
      authItems.map(async ({ element, ...rest }) => ({
        ...rest,
        html: await render(element),
      })),
    );

    /* Every business email, rendered from the real sender so the preview
       always matches what the customer actually receives. */
    const to = "customer@example.com";
    const businessId = "preview";
    const businessName = "Sparkle & Shine Cleaning Co.";
    const slug = "sparkle-and-shine";
    const expiresAt = new Date(Date.now() + 12 * 3600_000).toISOString();

    const live: Array<{
      key: string;
      name: string;
      description: string;
      group: string;
      run: () => unknown;
    }> = [
      {
        key: "welcome",
        name: "Welcome / website ready",
        description: "Sent as soon as a customer's first website is built.",
        group: "Customer journey",
        run: () => emails.sendWelcomeEmail({ to, businessId, businessName }),
      },
      {
        key: "site_published",
        name: "Website is live",
        description: "Sent the moment a customer publishes their site.",
        group: "Customer journey",
        run: () => emails.sendSitePublishedEmail({ to, businessId, businessName, slug }),
      },
      {
        key: "review_request",
        name: "Review request",
        description: "One-time ask for a Google review after going live.",
        group: "Customer journey",
        run: () => emails.sendReviewRequestEmail({ to, businessId, businessName }),
      },
      {
        key: "new_lead",
        name: "New enquiry",
        description: "Sent to the business owner when their site gets an enquiry.",
        group: "Customer journey",
        run: () =>
          emails.sendNewLeadEmail({
            to,
            businessId,
            businessName,
            lead: {
              name: "Dana Whitfield",
              email: "dana@example.com",
              phone: "(704) 555-0142",
              service: "Deep cleaning",
              preferred_time: "Weekday mornings",
              message: "Looking for a one-off deep clean before we move in.",
            },
          }),
      },
      {
        key: "payment_received",
        name: "Payment received",
        description: "Sent when a plan payment succeeds and access switches on.",
        group: "Payments",
        run: () => emails.sendPaymentReceivedEmail({ to, businessId, planName: "Website + SEO" }),
      },
      {
        key: "payment_failed",
        name: "Payment failed",
        description: "Sent when a card is declined on renewal.",
        group: "Payments",
        run: () => emails.sendPaymentFailedEmail({ to, businessId }),
      },
      {
        key: "access_paused",
        name: "Plan ended",
        description: "Sent when a subscription ends and the site goes offline.",
        group: "Payments",
        run: () => emails.sendAccessPausedEmail({ to, businessId }),
      },
      {
        key: "renewal_reminder",
        name: "Renewal reminder",
        description: "Heads-up before the next monthly charge.",
        group: "Payments",
        run: () =>
          emails.sendRenewalReminderEmail({
            to,
            businessId,
            planName: "Premium",
            renewsOn: "12 October",
          }),
      },
      {
        key: "manual_preview",
        name: "Demo site ready",
        description: "Sent to a prospect when the team builds them a demo site.",
        group: "Manual sites",
        run: () =>
          emails.sendManualPreviewEmail({
            to,
            businessId,
            businessName,
            slug,
            expiresAt,
            contactName: "Dana",
          }),
      },
      {
        key: "manual_site_activated",
        name: "Demo site paid & live",
        description: "Sent the moment a demo site is paid for and made permanent.",
        group: "Manual sites",
        run: () => emails.sendManualSiteActivatedEmail({ to, businessId, businessName, slug }),
      },
      {
        key: "domain_ordered",
        name: "Domain ordered",
        description: "Sent after a customer pays the $20 domain fee.",
        group: "Domains",
        run: () => emails.sendDomainOrderedEmail({ to, businessId, domain: "sparkleclean.com" }),
      },
      {
        key: "domain_request_received",
        name: "Domain request received",
        description: "Sent when a customer connects a domain they already own.",
        group: "Domains",
        run: () =>
          emails.sendDomainRequestReceivedEmail({ to, businessId, domain: "sparkleclean.com" }),
      },
      {
        key: "domain_reminder",
        name: "Domain reminder",
        description: "Nudge when the DNS records still haven't been added.",
        group: "Domains",
        run: () => emails.sendDomainReminderEmail({ to, businessId, domain: "sparkleclean.com" }),
      },
      {
        key: "domain_live",
        name: "Domain connected",
        description: "Sent when a customer's own domain goes live.",
        group: "Domains",
        run: () =>
          emails.sendDomainLiveEmail({
            to,
            businessId,
            domain: "sparkleclean.com",
            secure: true,
          }),
      },
      {
        key: "support_reply",
        name: "Support reply",
        description: "Sent when the team answers a support conversation.",
        group: "Support",
        run: () =>
          emails.sendSupportReplyEmail({
            to,
            businessId,
            message: "Thanks for getting in touch — your gallery photos are updated now.",
          }),
      },
      {
        key: "enquiry_reply",
        name: "Enquiry reply",
        description: "Sent when staff reply to a website enquiry from the admin area.",
        group: "Support",
        run: () =>
          emails.sendEnquiryReplyEmail({
            to,
            name: "Dana",
            subject: "Re: your question about pricing",
            message: "Happy to help — our Basic plan is $37 a month with no setup fee.",
            original: "Hi, how much does a cleaning website cost?",
          }),
      },
      {
        key: "admin_new_customer",
        name: "Admin: new signup",
        description: "Internal alert when a new customer signs up.",
        group: "Internal alerts",
        run: () =>
          emails.adminNewCustomer({
            businessId,
            businessName,
            email: to,
            niche: "Cleaning",
          }),
      },
      {
        key: "admin_payment",
        name: "Admin: payment event",
        description: "Internal alert for payments, failures and cancellations.",
        group: "Internal alerts",
        run: () =>
          emails.adminPaymentEvent({
            businessId,
            businessName,
            outcome: "received",
            planName: "Website + SEO",
          }),
      },
      {
        key: "admin_support_message",
        name: "Admin: support message",
        description: "Internal alert when a customer writes in.",
        group: "Internal alerts",
        run: () =>
          emails.adminSupportMessage({
            businessId,
            businessName,
            message: "Can you swap the hero photo please?",
          }),
      },
      {
        key: "admin_checkout_blocked",
        name: "Admin: payments paused",
        description: "Internal alert after repeated declined card attempts.",
        group: "Internal alerts",
        run: () => emails.adminCheckoutAbuse({ businessId, businessName, failures: 5 }),
      },
      {
        key: "admin_domain_request",
        name: "Admin: domain request",
        description: "Internal alert when a domain needs setting up.",
        group: "Internal alerts",
        run: () =>
          emails.adminDomainRequest({
            businessId,
            businessName,
            domain: "sparkleclean.com",
            kind: "purchase",
            paid: true,
          }),
      },
    ];

    for (const item of live) {
      const result = emails.captureEmail(item.run);
      if (!result) continue;
      rendered.push({
        key: item.key,
        name: item.name,
        description: item.description,
        group: item.group,
        subject: result.subject,
        html: result.html,
      });
    }

    return rendered;
  },
);
