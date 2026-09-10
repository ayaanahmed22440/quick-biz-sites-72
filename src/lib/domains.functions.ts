import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Where a customer domain must point for us to serve their site. */
export const DOMAIN_TARGET_IP = "185.158.133.1";

type DnsAnswer = { name: string; type: number; data: string };

async function resolve(name: string, type: "A" | "CNAME"): Promise<string[]> {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { accept: "application/dns-json" } },
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { Answer?: DnsAnswer[] };
    return (body.Answer ?? []).map((a) => a.data.replace(/\.$/, ""));
  } catch {
    return [];
  }
}

const input = z.object({ domainId: z.string().uuid() });

/**
 * Looks up the customer's DNS records live and updates the domain row.
 * Emails the owner the first time the domain answers correctly.
 */
export const checkDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => input.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("domains")
      .select("id, domain, business_id, status, ssl_active")
      .eq("id", data.domainId)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("That domain is no longer on your account");

    const [apex, www] = await Promise.all([
      resolve(row.domain, "A"),
      resolve(`www.${row.domain}`, "A"),
    ]);

    const apexOk = apex.includes(DOMAIN_TARGET_IP);
    const wwwOk = www.includes(DOMAIN_TARGET_IP);
    const anyRecord = apex.length > 0 || www.length > 0;

    const status: "pending" | "verifying" | "active" = apexOk
      ? "active"
      : anyRecord
        ? "verifying"
        : "pending";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("domains")
      .update({
        status,
        ssl_active: apexOk,
        ssl_status: apexOk ? "active" : "pending",
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (status === "active" && row.status !== "active") {
      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("id, email")
        .eq("id", row.business_id)
        .maybeSingle();
      if (business?.email) {
        const { sendDomainLiveEmail } = await import("@/lib/emails.server");
        await sendDomainLiveEmail({
          to: business.email,
          businessId: business.id,
          domain: row.domain,
          secure: true,
        });
      }
    }

    return {
      status,
      apexOk,
      wwwOk,
      found: anyRecord,
      message: apexOk
        ? wwwOk
          ? "Your domain is pointing at your website and the padlock is on."
          : "Your main domain works. The www version still needs its record."
        : anyRecord
          ? "We can see records, but they're not pointing at us yet — or they're still spreading across the internet. Try again in an hour."
          : "No records found yet. Add the two records at your domain provider, then check again.",
    };
  });

/** Nudges owners whose records still aren't in place after two days. */
export const remindPendingDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase.rpc("is_platform_staff", {
      _user_id: context.userId,
    });
    if (!staff) throw new Error("Staff access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("domains")
      .select("id, domain, business_id, dns_notes")
      .neq("status", "active")
      .lt("created_at", cutoff);

    const { sendDomainReminderEmail } = await import("@/lib/emails.server");
    let sent = 0;
    for (const row of rows ?? []) {
      if (row.dns_notes === "reminded") continue;
      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("id, email")
        .eq("id", row.business_id)
        .maybeSingle();
      if (!business?.email) continue;
      await sendDomainReminderEmail({
        to: business.email,
        businessId: business.id,
        domain: row.domain,
      });
      await supabaseAdmin.from("domains").update({ dns_notes: "reminded" }).eq("id", row.id);
      sent += 1;
    }
    return { sent };
  });
