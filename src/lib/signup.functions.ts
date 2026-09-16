import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Passwordless onboarding account creation.
 *
 * Called the moment someone types the enquiry email during onboarding. A brand
 * new address gets an account plus a one-time token so the browser can start a
 * session in place. An address that already has an account NEVER gets a token
 * back — that would let anyone take over an account by typing its email. Those
 * people get a magic link in their inbox instead.
 */

const input = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().max(120).optional(),
});

export const startOnboardingAccount = createServerFn({ method: "POST" })
  .inputValidator((data) => input.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();

    const { enforceRateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
      await enforceRateLimit({
        bucket: "onboarding-account-ip",
        subject: ip,
        limit: 10,
        windowSeconds: 60 * 10,
      });
      await enforceRateLimit({
        bucket: "onboarding-account-email",
        subject: email,
        limit: 5,
        windowSeconds: 60 * 10,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return { status: "error" as const, message: error.message };
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      ...(data.fullName ? { user_metadata: { full_name: data.fullName } } : {}),
    });

    if (createError || !created?.user) {
      const message = (createError?.message ?? "").toLowerCase();
      const exists =
        message.includes("already") || message.includes("registered") || message.includes("exists");
      if (exists) return { status: "existing" as const };
      console.error("Onboarding account creation failed", createError);
      return { status: "error" as const, message: "We couldn't set that up. Please try again." };
    }

    // One-time token so the browser can establish the session without a password.
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("Onboarding magic token failed", linkError);
      return { status: "existing" as const };
    }

    return { status: "created" as const, tokenHash };
  });
