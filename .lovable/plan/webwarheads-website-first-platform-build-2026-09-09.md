# WebWarheads — website-first platform build

Turn the current app into the full journey: sign up → business setup → pick a design → see a real website → customise → pay → get online → dashboard. Whop checkout stays exactly as it is today.

## What already works (not touching)

- Email/password + optional Google sign-in, staff login, roles
- Whop checkout, verified webhook, automatic activation on payment (no admin approval)
- Plans and entitlements ($37 / $68 / $97, monthly + yearly)
- Leads capture, SEO settings, sitemap, support, admin overvie

## Phase 1 — Business data model and industries

One structured business record every template reads from: name, logo, brand colours, phone, email, address, hours, services, service areas, about, tagline, gallery images, reviews, social links.

Seven industries available at signup: Landscaping, Cleaning, Roofing, Plumbing, Renovation, Construction, Junk Removal. Adding an eighth later is one row, not a code change.

Rebuild onboarding as a short wizard with a progress bar and autosave: Business → Industry → Contact & areas → Services & hours → Logo & photos (all skippable). Nothing is a giant form.

## Phase 2 — Template engine + 7 templates

Shared, reusable section components (header, hero, services, about, gallery, reviews, service areas, CTA, contact, footer) with variants, driven purely by the business record. One polished template per industry, styled like a premium WordPress theme: real typography, restrained motion, no gradients or AI-startup look.

Each template ships with professional industry starter photography so a site looks finished with zero uploads.

## Phase 3 — Media library and branding

Per-client media library: upload, replace, delete, reorder gallery, reuse. Every image slot offers "Upload my own / Choose from included / Keep current". Logo upload (PNG, JPG, SVG) with automatic colour extraction and a "Use colours from my logo" suggestion the customer can override.

## Phase 4 — Preview and section editor

Full-page preview with desktop / tablet / mobile switching, plus Edit Website, Continue, Open full preview. Section-based editor: pick a section from a list, edit only its fields, changes appear in the preview.

## Phase 5 — Publish flow with existing checkout

Preview → "Your website is ready to go live" → plan picker → the existing Whop checkout → payment lands → customer returns to exactly where they were and continues. Site states: draft, ready, published, unpublished, suspended.

## Phase 6 — Getting online

Three choices after payment:

1. Free WebWarheads address (`webwarheads.com/theirbusiness`) — works instantly today
2. Buy a new domain — real search and pricing wired to a registrar
3. Connect a domain they already own — exact records shown, background DNS checking, live Domain / SSL status without refreshing

Never blocks them: they can leave and come back, dashboard shows the pending state.

## Phase 7 — Dashboard, health, leads, admin

Customer dashboard: greeting, live site link, Website / Domain / SSL / Google Business status, health score, lead count, quick actions. Website health from real signals (published, domain, SSL, mobile, SEO fields, sitemap).

Leads with statuses: New, Contacted, Quote Sent, Booked, Completed, Lost.

Admin: platform totals, revenue, clients table (website, plan, payment, domain, status) and a full client view with business, website, domain, payment, leads and an activity timeline.

## Phase 8 — Optional extras

Google Business Profile as an optional post-payment step (proper Google sign-in, never a password), plus app-wide light / dark / system mode.

## Things I need from you

- **Buying domains inside WebWarheads (Phase 6, option 2):** this needs a reseller account with a registrar (Cloudflare, Namecheap or OpenSRS) and their API key. Until you have one I'll build the search/purchase screens against the real interface but keep the buy button disabled rather than fake availability.
- **Google Business Profile (Phase 8):** needs a Google Cloud project with the Business Profile API approved. I'll build the connect flow and leave it switched off until the credentials exist.
- Everything else I can do without you.

## Technical notes

- Business data lives in normalised tables (business, services, service_areas, hours, media, reviews, socials) with tenant-scoped RLS and grants; templates receive a single assembled object, never raw queries.
- Templates registered in a registry keyed by industry so new designs drop in without touching generation.
- Starter imagery generated once per industry and bundled as assets, shared across all clients.
- Logo/photo uploads need a storage bucket; if bucket creation is still blocked in this workspace I'll fall back to image links and flag it.
- Domain verification runs server-side on a schedule, writing status to the database; the UI just reads it.
- No change to `whop.server.ts`, `whop-sync.server.ts`, `billing.functions.ts` or the webhook route.

## Order of delivery

Phases 1–2 first (the actual product), then 3–5, then 6–7, then 8. Each phase ships working and buildable so you can look at it as it lands.