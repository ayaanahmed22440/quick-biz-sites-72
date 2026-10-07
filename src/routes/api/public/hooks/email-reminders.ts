import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled reminder emails (called by the background scheduler).
 *
 * Idempotent by design: every reminder is claimed in `email_reminders` with a
 * unique key before sending, so repeat calls never send anything twice and
 * only ever email people whose reminder is actually due.
 */
const HOUR = 3600_000;
const CHECKOUT_STAGES: Array<{ stage: 1 | 2 | 3; afterHours: number }> = [
  { stage: 1, afterHours: 2 },
  { stage: 2, afterHours: 24 },
  { stage: 3, afterHours: 72 },
];

export const Route = createFileRoute("/api/public/hooks/email-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const emails = await import("@/lib/emails.server");
        const { presetFor } = await import("@/lib/template-registry");
        const now = Date.now();
        let sent = 0;

        async function claim(key: string, kind: string, businessId: string, recipient: string) {
          const { error } = await supabaseAdmin
            .from("email_reminders")
            .insert({ reminder_key: key, kind, business_id: businessId, recipient });
          return !error;
        }

        /* ---------------------------------------------- demo (manual) sites */
        const { data: manuals } = await supabaseAdmin
          .from("manual_sites")
          .select("id, business_id, contact_email, contact_name, created_at, expires_at, status")
          .not("status", "in", "(paid,cancelled)")
          .gt("expires_at", new Date(now).toISOString())
          .limit(200);

        for (const m of manuals ?? []) {
          const left = new Date(m.expires_at).getTime() - now;
          const age = now - new Date(m.created_at).getTime();
          const stage: "early" | "final" | null =
            left <= HOUR ? "final" : age >= 6 * HOUR ? "early" : null;
          if (!stage) continue;
          const { data: b } = await supabaseAdmin
            .from("businesses")
            .select("name, slug, niche")
            .eq("id", m.business_id)
            .maybeSingle();
          if (!b) continue;
          if (!(await claim(`manual:${m.id}:${stage}`, `manual_${stage}`, m.business_id, m.contact_email))) continue;
          await emails.sendManualExpiryReminderEmail({
            to: m.contact_email,
            businessId: m.business_id,
            businessName: b.name,
            slug: b.slug,
            nicheLabel: presetFor(b.niche).industryLabel,
            manualId: m.id,
            stage,
            contactName: m.contact_name,
          });
          sent += 1;
        }

        /* ------------------------------- finished onboarding, never paid */
        const since = new Date(now - 10 * 24 * HOUR).toISOString();
        const { data: finished } = await supabaseAdmin
          .from("onboarding_progress")
          .select("business_id, email, completed_at")
          .eq("completed", true)
          .gt("completed_at", since)
          .not("business_id", "is", null)
          .limit(300);

        for (const row of finished ?? []) {
          if (!row.business_id || !row.email || !row.completed_at) continue;
          const age = now - new Date(row.completed_at).getTime();
          const due = [...CHECKOUT_STAGES].reverse().find((s) => age >= s.afterHours * HOUR);
          if (!due) continue;

          const [{ data: subs }, { data: manual }, { data: b }] = await Promise.all([
            supabaseAdmin
              .from("subscriptions")
              .select("id")
              .eq("business_id", row.business_id)
              .in("status", ["active", "trialing", "past_due"])
              .limit(1),
            supabaseAdmin.from("manual_sites").select("id").eq("business_id", row.business_id).maybeSingle(),
            supabaseAdmin.from("businesses").select("name, niche").eq("id", row.business_id).maybeSingle(),
          ]);
          if ((subs ?? []).length || manual || !b) continue;

          // Only send the latest due stage; earlier ones are marked so they never go out late.
          for (const s of CHECKOUT_STAGES.filter((x) => x.stage < due.stage)) {
            await claim(`checkout:${row.business_id}:${s.stage}`, `checkout_${s.stage}_skipped`, row.business_id, row.email);
          }
          if (!(await claim(`checkout:${row.business_id}:${due.stage}`, `checkout_${due.stage}`, row.business_id, row.email))) continue;
          await emails.sendCheckoutReminderEmail({
            to: row.email,
            businessId: row.business_id,
            businessName: b.name,
            nicheLabel: presetFor(b.niche).industryLabel,
            stage: due.stage,
          });
          sent += 1;
        }

        return Response.json({ ok: true, sent });
      },
    },
  },
});
