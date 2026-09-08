# WebWarheads — Phase 1: Public Site + Accounts

Foundation build: the brand, the conversion-focused public site, real sign-up/login, and the shells of the customer and admin areas — built on a multi-tenant data model so later phases (editor, templates, SEO, domains, leads) drop in without rework.

## What you'll be able to do after this

- Land on a direct, commercially focused homepage that states the offer, price and speed up front.
- Read a polished pricing page with the $37 / $68 / $97 plans, differences, recommendation and FAQ.
- Create an account, log in, log out, reset a password.
- Complete a short onboarding that captures the business (name, services, city, service areas, contact).
- See a customer dashboard shell that reflects the plan you're on, with SEO locked behind an upgrade prompt for the $37 tier.
- See an admin area, restricted to WebWarheads staff accounts, listing real customers and businesses (no invented metrics).

## Brand and visual direction

Taken from the supplied logo: deep navy base, hot pink as the single accent, white text. No purple gradients, no glassmorphism, no floating blobs, no emoji UI. Restrained spacing scale, strong type hierarchy, plain cards, clear buttons. Reference feel: Stripe/Linear discipline, Hostinger's plain-language commercial tone. The logo becomes the app brand mark and the favicon.

## Pages in this phase

Public
- Home — hero ("Get your business website live for pennies, not $1,500+"), who it's for, how it works in 3 steps, what's included, price anchor vs a traditional designer, FAQ, final CTA. Primary CTA "Get Your Website Live", secondary "See How It Works".
- Pricing — three tiers, $68 marked as recommended for businesses that want to be found locally, feature comparison, FAQ.
- How It Works, Contact, Terms, Privacy.

Auth
- Sign up, log in, forgot password, reset password. Email + password, plus Google sign-in.

Customer area (behind login)
- Onboarding wizard: business info → services → service areas → contact/hours.
- Dashboard home: website status, plan, quick actions, next steps.
- Navigation stubs present and honest: Website, Business, Media, SEO, Domains, Leads, Billing, Support, Settings. Sections not yet built show a clear "coming in the next build" state rather than fake data or dead buttons.
- Business section is fully functional in this phase (view/edit business info, services, hours, service areas).

Admin area (staff only)
- Customers and businesses list with search and detail view.
- Real counts only (accounts, businesses, plan distribution). No MRR or metrics we can't compute yet.

## Plans and entitlements

One central definition of plans and what each unlocks, driven off the subscription record:

```text
basic   -> website, editor, leads, domains
seo     -> basic + seo
premium -> seo + priority_support
```

Every gate in the app (UI and server) reads that single source. Nothing is hardcoded per-component, so adding a plan or moving a feature between tiers is a one-line change. In this phase every new account starts with no active subscription and sees the plan-selection/upgrade path.

## Billing (Whop)

You have Whop access, so this phase builds the real structure and the first live piece:
- Plan records mapped to your Whop plan IDs, stored server-side.
- Checkout hand-off: choosing a plan sends the customer to Whop checkout for that plan.
- A webhook endpoint that verifies Whop's signature and records subscription created / renewed / payment failed / cancelled, updating the customer's plan and entitlements automatically — including on upgrade.
- Nothing is faked. If credentials or plan IDs aren't set, the checkout button shows a clear "billing not configured" state instead of pretending.

I'll ask you for the Whop API key, webhook secret and the three plan IDs through the secure secrets form when we reach that step.

## Data model (multi-tenant from day one)

Created now, even where a later phase fills it in, so nothing has to be migrated later:

users/profiles, businesses, business_members (role per business), plans, subscriptions, entitlements (derived), services, service_areas, business_hours, templates, template_versions, websites, website_customizations, media, domains, leads, seo_settings, seo_targets, support_tickets, notifications, activity_logs, user_roles (separate table — admin/staff never stored on the profile).

Every tenant table carries a business reference and is protected with row-level security scoped to membership, so one customer can never read another's data. Admin access goes through a security-definer role check, never a client-side flag. Grants are issued explicitly per table.

## Deployment portability

The app is built on this project's standard stack and hosted here for now, per your choice. To keep the move option open: no secrets in frontend code, no hardcoded localhost, all config through environment variables, data in Supabase (yours, exportable), source synced to GitHub on `main`, and an `.env.example` listing every variable. A separate Hostinger port would mean restructuring the runtime — worth doing as its own project once the product is proven, not now.

## Explicitly not in this phase

Cleaning Template 01 and the rendering engine, the website editor, save & publish, SEO engine, domain purchase/connect, lead capture forms, Google Business Profile, support ticketing, analytics, social/CRM. All have their tables and navigation placeholders created here and get built in the following phases.

## Technical notes

- Lovable Cloud (Supabase) enabled for auth, database, storage; RLS on every tenant table; role checks via a security-definer function.
- Entitlements resolved server-side and passed to the client; UI gating is presentation only, never the security boundary.
- Whop webhook lives on a public API route with HMAC signature verification before any write; privileged writes use the service client only after verification.
- Route-level metadata (title, description, social tags) set per public page; sitemap and robots for the marketing site.
- Shared layout primitives (page shell, section, card, table, empty/loading/error states) built once and reused, to avoid monolithic components later.
