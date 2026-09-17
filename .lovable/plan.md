# Manual Sites — admin-built demo sites with a pay-to-keep countdown

A new admin section for prospects who come from Messenger or direct outreach: the team builds the site for them, sends a link, and the site turns into a real paying customer account the moment payment lands — no manual migration.

## How it works for the team

1. **Admin > Manual Sites > New demo site.** One form: business name, trade/niche, contact name, email, phone, city, tagline/description, services, logo and images, plus which plan the pay button should charge ($37 / $68 / $97, monthly or yearly) and how long the preview lasts (default 12 hours, editable).
2. **Create** builds the site through the existing site-builder pipeline (same niche templates, same content model, same publishing path used for self-serve customers) and publishes it at its normal address, e.g. `www.webwarheads.com/sparkle-cleaning`.
3. The team copies that link and sends it to the prospect.
4. **Edit** opens the existing client website editor, so the team can keep refining the demo before or after sending it.

## What the prospect sees

- The live site, with a slim banner pinned to the top: "Payment pending — this preview expires in 11:42:08", a live countdown, and a **Pay now** button.
- Pay now goes straight to Polar checkout for the plan the team picked (no account or login needed first).
- When the countdown reaches zero without payment, the address stops serving the site and shows a short "This preview has expired — contact us to bring it back" page. The team can extend or re-open it from the admin panel with one click.

## What happens on payment

Driven only by the verified Polar webhook (never the browser redirect), exactly like the existing flow:

- The demo is marked **paid**: banner gone, expiry cleared, site permanently live.
- The prospect's email becomes a real account (passwordless, same as self-serve onboarding), owning that business, and they get a welcome email with a sign-in link so they can log into their dashboard.
- The subscription row is written the same way as any other customer, so they appear in the **Users** list and in monthly recurring revenue with no extra step.
- If the countdown had already expired, payment brings the site straight back.

## Status view

A table inside Manual Sites: business name, link, plan, created date, time remaining (live countdown), and a Pending / Paid / Expired badge, plus filters and actions — copy link, edit site, extend countdown, resend the link by email, delete.

## Technical notes

- **New table `public.manual_sites`**: `business_id`, `created_by`, `contact_email`, `contact_name`, `plan_id`, `expires_at`, `status` (`pending` | `paid` | `expired` | `cancelled`), `checkout_session_id`, `paid_at`, timestamps. RLS: staff-only read/write via `is_platform_staff`; GRANTs for `authenticated` + `service_role`. Public gating reads it through a security-definer function only.
- **Ownership before payment**: the business needs an owner. At creation we create the auth user for the contact email with no email sent (`createUser`, `email_confirm: true`) and mark it manual/pending in `onboarding_progress`-style metadata, so it is excluded from the admin Users list until paid. If the email already has an account, we attach the demo to that existing user instead of creating a duplicate.
- **Public gating**: extend `get_published_site` (new migration, same signature) to also return a `manual` block — `{ status, expires_at }` — and to return `null` when a linked `manual_sites` row is `pending` with `expires_at < now()` or is `cancelled`. `PublicSiteView` renders the banner from that block; `$slug`/`s.$slug`/custom-host routes are unchanged otherwise. Sitemap/indexing excludes pending demos (`indexing_enabled` false until paid).
- **Pay now**: new public server route `src/routes/api/public/manual-checkout/$id` (or an unauthenticated server fn) that looks up the manual site, reuses `createPolarCheckout` from `polar.server.ts` with `external_customer_id = business_id` and metadata `{ manual_site_id, business_id, plan_id }`, writes a `checkout_sessions` row (`user_id` = the pre-created owner), and redirects to Polar. Rate-limited per IP via the existing `rate-limit.server` helper.
- **Webhook**: `polar-sync.server.ts` already resolves ownership from `checkout_session_id` / `business_id` metadata, so subscription syncing works unchanged. Added on top: when the synced business has a `manual_sites` row, flip it to `paid`, clear `expires_at`, turn indexing on, and send the sign-in/welcome email through the existing Gmail templates. Idempotent — repeat deliveries change nothing.
- **Expiry** is evaluated at request time from `expires_at`; no cron needed.
- **Untouched**: existing checkout, `startCheckout`, Polar products/webhook config, self-serve onboarding, pricing, Meta Pixel events, auth, and all current UI.
