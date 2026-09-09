# WebWarheads roadmap

## Done
- Preview typecheck and production build are error-free
- Public site: home, pricing, how it works, contact, terms, privacy (mobile tuned)
- Auth: email/password, Google, password reset
- Onboarding, business profile, customer dashboard, admin dashboard
- Plans + centralised entitlements ($37 / $68 / $97) — payment provider removed, to be rebuilt
- Cleaning Template 01 (split hero + booking, Archivo Black / Hind, brand colour from customer logo)
- Website editor with draft, Save draft, Save & publish, live preview
- Published customer sites at /s/{slug} with lead capture into Leads
- SEO settings: title, description, local targeting, structured data toggles, sitemap
- Domains: add/remove a domain you own, free WebWarheads address
- Deployment: hosted on Lovable, GitHub for version control, Lovable Cloud backend

- Staff login at /admin-login, Google sign-in returns via /auth/callback
- Free build, pay at publish (editor open to everyone, publishing needs a plan)
- Domain help page with walkthrough placeholder + free subdomain option
- Administrator-only team invitations and staff access review
- Google login returns to the site root, then routes staff or customers

- Whop billing rebuilt: real server-side checkout, verified webhook, subscription sync, plan entitlements
- Instant activation on payment — no admin approval anywhere in customer signup
- LIVE TEST PASSED: real $37 checkout (coupon test123) → webhook verified → subscription flipped to basic/active automatically

## Next up
- Step-by-step onboarding with live preview and autosave
- Template library engine + admin template management
- Full admin control centre (billing events, websites, domains, leads)
- App-wide dark mode (light / dark / system)

## Open (blocked or awaiting input)
- Whop webhook is LIVE and verified working: https://webwarheads.com/api/public/whop-webhook (membership.activated, membership.deactivated, membership.cancel_at_period_end_changed, payment.succeeded, payment.failed) — no action needed
- Email from support@webwarheads.com: needs the sender domain set up (DNS)
- Wildcard DNS for *.webwarheads.com subdomains
- Media/logo upload: public file storage is blocked by workspace policy; logo is a web address for now
- Domain registrar buying inside WebWarheads: needs a reseller account (Namecheap/Cloudflare/OpenSRS) + payment/legal decisions
- Terms and privacy are drafts pending legal review
- Google Business Profile, social posting, CRM: later phases
- Analytics page: real visit/lead reporting

## Template engine (done 2026-09-09)
- One shared renderer (LocalBusinessTemplate) drives all designs.
- 7 approved presets: cleaning, landscaping, roofing, plumbing, renovation, construction, junk removal — each with starter photography, accent colour and hero layout variant.
- Onboarding industry list now maps 1:1 to the presets; the editor and admin gallery both preview desktop/tablet/mobile.
- Next: media uploads (private bucket "business-media" created; needs a public read route), onboarding autosave, dashboard/domain polish.
