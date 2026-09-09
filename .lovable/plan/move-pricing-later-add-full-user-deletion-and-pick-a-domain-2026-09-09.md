# Move pricing later, add full user deletion, and pick a domain approach

## 1. Take pricing out of the setup flow

Right now the last setup question asks for a plan and sends people to checkout before they have seen their finished site.

- Remove the "Which plan suits you?" step and the "Plan" stage from the progress bar. Setup now ends after reviews.
- Finishing setup saves everything and drops the customer straight into the editor with their site ready to look at — no payment, no skip button.
- The editor keeps the existing behaviour: "Save draft" is always free, and "Publish my site" opens the plan cards and takes them to secure checkout. That stays the only place money is asked for.
- The plan cards component itself is untouched, so nothing about Whop checkout, webhooks or activation changes.

## 2. Admin: delete a customer completely

New "Delete customer" action on each client row in the admin centre, behind a confirm dialog that requires typing the business name.

It permanently removes, for that account: the website and its saved content, media files (both the stored files and their records), services, service areas, opening hours, reviews, leads, SEO settings and targets, domains, support tickets and messages, notifications, integrations, the business record, the sign-in account itself, and its profile and role rows. Billing history rows are kept so revenue reporting stays accurate, with the link to the deleted business cleared.

Guards: admin-only, and the action refuses to delete an account that holds an admin role.

## 3. Domains after payment — what I recommend

Research on doing this with the GoDaddy API:

- GoDaddy's public domain purchase API is not open self-serve. Buying on a customer's behalf needs an approved reseller/API agreement, a funded account, and you take on registrant data, ICANN verification, renewals, refunds, transfers and abuse handling. Their public API has also been repeatedly restricted to larger accounts, so building on it is a business risk, not just a code task.
- Whop handles the subscription only. It has no domain product, so a domain sold this way would be a second charge you bill and support yourself — including yearly renewals that are separate from the monthly plan.

So the honest recommendation is a three-step ladder, none of which requires becoming a registrar:

1. **Free address (day one).** Every published site already lives at `webwarheads.com/theirname`. Good enough to put on a van.
2. **Bring your own domain (build this next).** After payment, the publish flow shows a "Use my own domain" step: they type the domain, we show the two records to add, and we poll until it verifies and the padlock is live, emailing them when it goes green. This is mostly wiring the existing domains page into the post-payment flow.
3. **Guided purchase (optional, later).** Use a domain-connect partner (for example Entri) so the customer searches and buys a name in a popup and the records are written automatically at their provider. The partner is the registrar of record — we get the smooth experience without the licensing, renewals and support burden.

I would not build GoDaddy reselling now. If you still want to own the sale later, the cleanest version is: sell the domain as a one-off through your existing payment provider, and register it through a reseller account once the paperwork is in place.

## Technical notes

- `src/routes/onboarding.tsx`: drop the `plan` step, `plan` stage, `PlanPicker`, and the checkout branch in `finish()`; keep draft autosave and the local plan key removal. Finish navigates to `/website`.
- `src/routes/_authenticated/website.tsx` and `src/components/billing/PlanChooser.tsx`: unchanged.
- New `src/lib/admin.functions.ts` with a `deleteCustomer` server function using `requireSupabaseAuth`, re-checking `has_role(admin)` through the user's own client, then loading `supabaseAdmin` inside the handler to remove storage objects and rows in dependency order and finally `auth.admin.deleteUser`. Writes an `activity_logs` entry.
- `src/routes/_authenticated/admin.tsx`: confirm dialog + mutation + query invalidation.
- No schema migration needed; deletion is data-only.
