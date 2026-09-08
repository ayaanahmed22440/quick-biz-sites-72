# WebWarheads roadmap

## Done
- Preview typecheck and production build are error-free
- Public site: home, pricing, how it works, contact, terms, privacy (mobile tuned)
- Auth: email/password, Google, password reset
- Onboarding, business profile, customer dashboard, admin dashboard
- Plans + centralised entitlements ($37 / $68 / $97), Whop webhook architecture
- Cleaning Template 01 (split hero + booking, Archivo Black / Hind, brand colour from customer logo)
- Website editor with draft, Save draft, Save & publish, live preview
- Published customer sites at /s/{slug} with lead capture into Leads
- SEO settings: title, description, local targeting, structured data toggles, sitemap
- Domains: add/remove a domain you own, free WebWarheads address
- Deployment: npm, single lock file, production start script, .env.example

- Staff login at /admin-login, Google sign-in returns via /auth/callback
- Free build, pay at publish (editor open to everyone, publishing needs a plan)
- Domain help page with walkthrough placeholder + free subdomain option
- Administrator-only team invitations and staff access review
- Google login uses the Hostinger-safe root return address

## Open (blocked or awaiting input)
- Email from support@webwarheads.com: needs the sender domain set up (DNS)
- Wildcard DNS for *.webwarheads.com subdomains
- Whop: needs API key, webhook secret and the three plan IDs before checkout works
- Google OAuth: add webwarheads.com to the Cloud auth URL allow-list
- Media/logo upload: public file storage is blocked by workspace policy; logo is a web address for now
- Domain registrar buying inside WebWarheads: needs a reseller account (Namecheap/Cloudflare/OpenSRS) + payment/legal decisions
- Terms and privacy are drafts pending legal review
- Google Business Profile, social posting, CRM: later phases
- Analytics page: real visit/lead reporting
