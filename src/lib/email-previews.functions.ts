import { createServerFn } from "@tanstack/react-start";

export type EmailPreviewItem = {
  key: string;
  name: string;
  subject: string;
  description: string;
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

    const siteName = "WebWarheads";
    const siteUrl = "https://webwarheads.com";
    const recipient = "customer@example.com";
    const url = "https://webwarheads.com/auth/callback?token=example";

    const items: Array<Omit<EmailPreviewItem, "html"> & { element: React.ReactElement }> = [
      {
        key: "signup",
        name: "Sign-up confirmation",
        subject: "Confirm your email",
        description: "Sent when someone creates a WebWarheads account.",
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
        element: React.createElement(ReauthenticationEmail, {
          siteName,
          token: "123456",
        } as never),
      },
    ];

    return Promise.all(
      items.map(async ({ element, ...rest }) => ({
        ...rest,
        html: await render(element),
      })),
    );
  },
);
