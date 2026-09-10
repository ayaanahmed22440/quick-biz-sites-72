import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  business_name: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10).max(2000),
});

/**
 * Public contact form. The table is no longer writable by the browser: every
 * message is validated and throttled here before it is stored.
 */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { enforceRateLimit, callerKey } = await import("./rate-limit.server");
    await enforceRateLimit({
      bucket: "contact",
      subject: callerKey(),
      limit: 5,
      windowSeconds: 3600,
      message: "You've sent a few messages already. Please try again later.",
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      message: data.message,
      business_name: data.business_name || null,
    });
    if (error) throw new Error("We couldn't send that. Please try again.");
    return { ok: true };
  });
