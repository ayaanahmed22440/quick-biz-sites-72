import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Email triggers that fire from the app UI. Each one checks that the caller is
 * allowed to act for the business, then sends through the connected Gmail.
 * A mail failure is reported, never thrown, so the UI action still succeeds.
 */

const businessInput = z.object({ businessId: z.string().uuid() });

async function loadBusiness(businessId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, email, niche, owner_id")
    .eq("id", businessId)
    .maybeSingle();
  return data;
}

/** Throws unless the signed-in user can act for this business. */
async function assertMember(context: { supabase: any; userId: string }, businessId: string) {
  const { data: allowed, error } = await context.supabase.rpc("is_business_member", {
    _user_id: context.userId,
    _business_id: businessId,
  });
  if (error) throw error;
  if (!allowed) throw new Error("You don't have access to that business");
}

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data: staff } = await context.supabase.rpc("is_platform_staff", {
    _user_id: context.userId,
  });
  if (!staff) throw new Error("Staff access required");
}

/** Sent once when someone finishes setup. */
export const notifyWelcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => businessInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertMember(context as never, data.businessId);
    const business = await loadBusiness(data.businessId);
    if (!business) return { sent: false };

    const { sendWelcomeEmail, adminNewCustomer } = await import("@/lib/emails.server");
    if (business.email) {
      await sendWelcomeEmail({
        to: business.email,
        businessId: business.id,
        businessName: business.name,
      });
    }
    await adminNewCustomer({
      businessId: business.id,
      businessName: business.name,
      email: business.email,
      niche: business.niche,
    });
    return { sent: true };
  });

/** Sent when a site goes live. */
export const notifySitePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => businessInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertMember(context as never, data.businessId);
    const business = await loadBusiness(data.businessId);
    if (!business?.email) return { sent: false };

    const { sendSitePublishedEmail } = await import("@/lib/emails.server");
    await sendSitePublishedEmail({
      to: business.email,
      businessId: business.id,
      businessName: business.name,
      slug: business.slug,
    });
    return { sent: true };
  });

/** Customer sent a support message — tell the team. */
export const notifySupportMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    businessInput.extend({ message: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context as never, data.businessId);
    const business = await loadBusiness(data.businessId);
    if (!business) return { sent: false };

    const { adminSupportMessage } = await import("@/lib/emails.server");
    await adminSupportMessage({
      businessId: business.id,
      businessName: business.name,
      message: data.message,
    });
    return { sent: true };
  });

/** Staff replied in the admin centre — email the customer. */
export const notifySupportReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    businessInput.extend({ message: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const business = await loadBusiness(data.businessId);
    if (!business?.email) return { sent: false };

    const { sendSupportReplyEmail } = await import("@/lib/emails.server");
    await sendSupportReplyEmail({
      to: business.email,
      businessId: business.id,
      message: data.message,
    });
    return { sent: true };
  });

/** Staff answering a website enquiry from the admin centre, via Gmail. */
export const replyToEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        messageId: z.string().uuid(),
        subject: z.string().min(2).max(200),
        message: z.string().min(2).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: enquiry, error } = await supabaseAdmin
      .from("contact_messages")
      .select("id, name, email, message")
      .eq("id", data.messageId)
      .maybeSingle();
    if (error) throw error;
    if (!enquiry?.email) throw new Error("That enquiry has no email address");

    const { sendEnquiryReplyEmail } = await import("@/lib/emails.server");
    const result = await sendEnquiryReplyEmail({
      to: enquiry.email,
      name: enquiry.name,
      subject: data.subject,
      message: data.message,
      original: enquiry.message,
    });
    if (!result?.sent) throw new Error("The email could not be sent — check the email log");

    await supabaseAdmin.from("contact_messages").update({ handled: true }).eq("id", enquiry.id);
    return { sent: true };
  });
