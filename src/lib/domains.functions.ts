import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Where a customer domain must point for us to serve their site. */
export const DOMAIN_TARGET_IP = "185.158.133.1";

type DnsAnswer = { name: string; type: number; data: string };

async function resolve(name: string, type: "A" | "CNAME" | "TXT"): Promise<string[]> {
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
    const { data: own, error } = await context.supabase
      .from("domains")
      .select("id, domain, business_id, status, ssl_active")
      .eq("id", data.domainId)
      .maybeSingle();
    if (error) throw error;

    let row = own;
    if (!row) {
      const { data: staff } = await context.supabase.rpc("is_platform_staff", {
        _user_id: context.userId,
      });
      if (!staff) throw new Error("That domain is no longer on your account");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminRow } = await supabaseAdmin
        .from("domains")
        .select("id, domain, business_id, status, ssl_active")
        .eq("id", data.domainId)
        .maybeSingle();
      row = adminRow;
    }
    if (!row) throw new Error("That domain is no longer on your account");

    const [apex, www, txt] = await Promise.all([
      resolve(row.domain, "A"),
      resolve(`www.${row.domain}`, "A"),
      resolve(`_lovable.${row.domain}`, "TXT"),
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
      records: [
        { label: `A @ (${row.domain})`, ok: apexOk, observed: apex },
        { label: `A www (www.${row.domain})`, ok: wwwOk, observed: www },
        {
          label: `TXT _lovable.${row.domain}`,
          ok: txt.length > 0,
          observed: txt.map((t) => t.replace(/^"|"$/g, "")),
        },
      ],
      message: apexOk
        ? wwwOk
          ? "Your domain is pointing at your website and the padlock is on."
          : "Your main domain works. The www version still needs its record."
        : anyRecord
          ? "We can see records, but they're not pointing at us yet — or they're still spreading across the internet. Try again in an hour."
          : "No records found yet. Add the two records at your domain provider, then check again.",
    };

  });

async function assertStaff(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: staff } = await (context.supabase as any).rpc("is_platform_staff", {
    _user_id: context.userId,
  });
  if (!staff) throw new Error("Staff access required");
}

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function normaliseDomain(raw: string) {
  const domain = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (!DOMAIN_PATTERN.test(domain)) throw new Error("That doesn't look like a valid domain name");
  return domain;
}

const DOMAIN_COLUMNS =
  "id, domain, kind, status, ssl_active, ssl_status, verification_token, admin_notes, created_at, last_checked_at, business_id, request_type, purchase_status, records_released, paid_at, fulfilled_at, checkout_url";

/** Every customer domain across the platform, for the admin setup queue. */
export const listAllDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("domains")
      .select(DOMAIN_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = [...new Set((rows ?? []).map((r) => r.business_id))];
    const { data: businesses } = ids.length
      ? await supabaseAdmin.from("businesses").select("id, name, slug").in("id", ids)
      : { data: [] as { id: string; name: string; slug: string }[] };
    const byId = new Map((businesses ?? []).map((b) => [b.id, b]));

    return (rows ?? []).map((row) => ({
      ...row,
      businessName: byId.get(row.business_id)?.name ?? "Unknown business",
      businessSlug: byId.get(row.business_id)?.slug ?? "",
    }));
  });

/**
 * Every client site with whatever domains it has, so the admin queue can also
 * show sites that are still on their free WebWarheads address.
 */
export const listDomainOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: businesses, error: bizError }, { data: domains, error: domError }] =
      await Promise.all([
        supabaseAdmin
          .from("businesses")
          .select("id, name, slug, email, suspended")
          .order("name"),
        supabaseAdmin.from("domains").select(DOMAIN_COLUMNS).order("created_at"),
      ]);
    if (bizError) throw bizError;
    if (domError) throw domError;

    const grouped = new Map<string, NonNullable<typeof domains>>();
    for (const d of domains ?? []) {
      const list = grouped.get(d.business_id) ?? [];
      list.push(d);
      grouped.set(d.business_id, list);
    }

    return (businesses ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      email: b.email,
      suspended: b.suspended,
      domains: grouped.get(b.id) ?? [],
    }));
  });

/** Staff attach a custom domain to a client site on the client's behalf. */
export const adminAddDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({ businessId: z.string().uuid(), domain: z.string().min(3).max(253) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const domain = normaliseDomain(data.domain);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: clash } = await supabaseAdmin
      .from("domains")
      .select("id, business_id")
      .eq("domain", domain)
      .maybeSingle();
    if (clash) throw new Error("That domain is already attached to a client site");

    const { data: row, error } = await supabaseAdmin
      .from("domains")
      .insert({ business_id: data.businessId, domain, kind: "connected" })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id, domain };
  });

/** Staff correct a typo in a domain that was already added. */
export const adminUpdateDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({ domainId: z.string().uuid(), domain: z.string().min(3).max(253) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const domain = normaliseDomain(data.domain);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: clash } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("domain", domain)
      .neq("id", data.domainId)
      .maybeSingle();
    if (clash) throw new Error("That domain is already attached to a client site");
    const { error } = await supabaseAdmin
      .from("domains")
      .update({
        domain,
        status: "pending",
        ssl_active: false,
        ssl_status: "pending",
        last_checked_at: null,
      })
      .eq("id", data.domainId);
    if (error) throw error;
    return { ok: true, domain };
  });

/** Staff detach a domain from a client site. */
export const adminRemoveDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ domainId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("domains").delete().eq("id", data.domainId);
    if (error) throw error;
    return { ok: true };
  });

/** Staff store the ownership token WebWarheads was given, plus internal notes. */
export const setDomainVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z
      .object({
        domainId: z.string().uuid(),
        verificationToken: z.string().max(300).nullable().optional(),
        adminNotes: z.string().max(4000).nullable().optional(),
        note: z.string().max(300).nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      verification_token?: string | null;
      dns_notes?: string | null;
      admin_notes?: string | null;
    } = {};
    if (data.verificationToken !== undefined) patch.verification_token = data.verificationToken || null;
    if (data.adminNotes !== undefined) patch.admin_notes = data.adminNotes || null;
    if (data.note !== undefined) patch.dns_notes = data.note || null;
    const { error } = await supabaseAdmin.from("domains").update(patch).eq("id", data.domainId);
    if (error) throw error;
    return { ok: true };
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
      .select("id, domain, business_id, reminded_at")
      .neq("status", "active")
      .lt("created_at", cutoff);

    const { sendDomainReminderEmail } = await import("@/lib/emails.server");
    let sent = 0;
    for (const row of rows ?? []) {
      if (row.reminded_at) continue;
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
      await supabaseAdmin
        .from("domains")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", row.id);
      sent += 1;
    }
    return { sent };

  });

/* ------------------------------------------------ customer-facing requests */

export const DOMAIN_SETUP_FEE_USD = 20;

/** The customer's own domains, with only the detail they're meant to see. */
export const listMyDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ businessId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("is_business_member", {
      _user_id: context.userId,
      _business_id: data.businessId,
    });
    if (!allowed) throw new Error("You don't have access to that business");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("domains")
      .select(
        "id, domain, status, ssl_active, request_type, purchase_status, records_released, verification_token, checkout_url, last_checked_at, created_at",
      )
      .eq("business_id", data.businessId)
      .order("created_at");
    if (error) throw error;
    return rows ?? [];
  });

/** Is this name still free to register? Uses the public RDAP registry. */
export const checkDomainAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ domain: z.string().min(3).max(253) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      await enforceRateLimit({
        bucket: "domain_availability",
        subject: context.userId,
        limit: 40,
        windowSeconds: 600,
        message: "That's a lot of searches — give it a minute and try again.",
      });
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
    }

    const domain = normaliseDomain(data.domain);
    try {
      const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
        headers: { accept: "application/rdap+json" },
      });
      if (res.status === 404) return { domain, available: true, known: true };
      if (res.ok) return { domain, available: false, known: true };
      return { domain, available: false, known: false };
    } catch {
      return { domain, available: false, known: false };
    }
  });

async function businessForCaller(
  context: { supabase: any; userId: string },
  businessId: string,
) {
  const { data: business, error } = await context.supabase
    .from("businesses")
    .select("id, name, email")
    .eq("id", businessId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!business) throw new Error("You don't have access to that business");
  return business as { id: string; name: string; email: string | null };
}

/** Option 1: the customer pays us $20 and we register + connect the name. */
export const requestDomainPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({ businessId: z.string().uuid(), domain: z.string().min(3).max(253) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const business = await businessForCaller(context as never, data.businessId);
    const domain = normaliseDomain(data.domain);
    const productId = process.env["POLAR_DOMAIN_PRODUCT_ID"];
    if (!productId) throw new Error("Domain purchases aren't switched on yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("domains")
      .select("id, business_id, purchase_status, checkout_url")
      .eq("domain", domain)
      .maybeSingle();
    if (existing && existing.business_id !== business.id) {
      throw new Error("That name is already being set up for another website.");
    }
    if (existing?.purchase_status === "paid" || existing?.purchase_status === "fulfilled") {
      return { alreadyPaid: true, url: null as string | null, domainId: existing.id };
    }
    if (existing?.checkout_url) {
      return { alreadyPaid: false, url: existing.checkout_url, domainId: existing.id };
    }

    const rowId =
      existing?.id ??
      (
        await supabaseAdmin
          .from("domains")
          .insert({
            business_id: business.id,
            domain,
            kind: "purchased",
            request_type: "purchase",
            purchase_status: "awaiting_payment",
            records_released: false,
          })
          .select("id")
          .single()
      ).data?.id;
    if (!rowId) throw new Error("Could not start that domain order.");

    const appUrl = process.env["APP_URL"] ?? "https://www.webwarheads.com";
    const { createPolarCheckout } = await import("@/lib/polar.server");
    const checkout = await createPolarCheckout({
      productId,
      externalCustomerId: business.id,
      customerEmail: business.email,
      metadata: { domain_request_id: rowId, business_id: business.id, domain },
      successUrl: `${appUrl}/domains?ordered=${encodeURIComponent(domain)}`,
    });

    await supabaseAdmin
      .from("domains")
      .update({ polar_checkout_id: checkout.id, checkout_url: checkout.url })
      .eq("id", rowId);

    return { alreadyPaid: false, url: checkout.url, domainId: rowId };
  });

/** Option 2: the customer already owns the name; we do the setup for them. */
export const requestOwnDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({ businessId: z.string().uuid(), domain: z.string().min(3).max(253) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const business = await businessForCaller(context as never, data.businessId);
    const domain = normaliseDomain(data.domain);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: clash } = await supabaseAdmin
      .from("domains")
      .select("id, business_id")
      .eq("domain", domain)
      .maybeSingle();
    if (clash && clash.business_id !== business.id) {
      throw new Error("That name is already connected to another website.");
    }
    if (clash) return { id: clash.id, domain, existing: true };

    const { data: row, error } = await supabaseAdmin
      .from("domains")
      .insert({
        business_id: business.id,
        domain,
        kind: "connected",
        request_type: "byo",
        purchase_status: "none",
        records_released: false,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { adminDomainRequest, sendDomainRequestReceivedEmail } = await import(
      "@/lib/emails.server"
    );
    await adminDomainRequest({
      businessId: business.id,
      businessName: business.name,
      domain,
      kind: "byo",
      paid: false,
    });
    if (business.email) {
      await sendDomainRequestReceivedEmail({
        to: business.email,
        businessId: business.id,
        domain,
      });
    }
    return { id: row.id, domain, existing: false };
  });

/* -------------------------------------------------------- staff fulfilment */

/** Staff flip whether the customer can see the DNS records for their domain. */
export const setDomainRecordsReleased = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({ domainId: z.string().uuid(), released: z.boolean() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("domains")
      .update({ records_released: data.released })
      .eq("id", data.domainId);
    if (error) throw error;
    return { ok: true };
  });

/** Staff mark a bought domain as registered and attached in hosting. */
export const markDomainFulfilled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ domainId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("domains")
      .update({
        purchase_status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
        status: "active",
        ssl_active: true,
        ssl_status: "active",
      })
      .eq("id", data.domainId)
      .select("domain, business_id")
      .single();
    if (error) throw error;

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
    return { ok: true };
  });
