# Safer deleting, real emails, and a proper domain journey

## 1. Delete customers safely (and in bulk)

The delete button currently relies on two browser pop-ups. Replacing it with a proper dialog:

- A tick-box list: every client row gets a checkbox, plus a "select all" box in the header.
- One "Delete selected (3)" button appears once anything is ticked.
- The confirm dialog lists exactly which businesses will go, spells out what is removed (site, images, leads, support history, sign-in account), and requires ticking **"I understand this cannot be undone"** before the red Delete button becomes clickable.
- Single-row delete uses the same dialog, so behaviour is identical.
- Deletions run one after another with a progress line ("2 of 5 removed"), and a summary at the end naming anything that was refused (for example an admin account).

The existing safety rules stay: admin only, never an account that holds admin access, never your own account, billing history kept for revenue reporting.

## 2. Every email goes out through your connected Gmail

Your Gmail is already connected and one email (new enquiry) uses it. Extending it to the rest, all with one branded look and all recorded in the admin email log:

**To the business owner**
- Welcome, right after they finish setup — what to do next, link to their editor.
- Their website is live — the address, a share prompt, and the "add your own domain" link.
- New enquiry (already live) — improved layout: name, phone, email, service, message, and a one-tap reply button.
- Payment declined — plain wording, what happens next, a button to retry payment, no threats.
- Payment overdue / access paused — sent when the plan lapses, explaining the site stays saved.
- Renewal coming up — a heads-up a few days before a yearly plan renews.
- Domain connected and secured — sent when their own domain goes live.
- Support reply — when staff answer their message.

**To you (admin)**
- New customer signed up, new payment received, payment failed, and new support message — short digest-style notes so nothing is missed.

All templates share one header/footer so they look consistent and clean, plain-text alternatives included so they are less likely to land in spam. Sending failures never break the action that triggered them; they just show as failed in the email log.

## 3. Buying and connecting a domain

Two clear routes on a rebuilt Domains page, plus a full guide.

**"I don't have a domain yet"**
- A step-by-step GoDaddy walkthrough page: searching a good name for a local business, what to avoid (.info, hyphens, long names), roughly what to pay, why to skip the upsells at checkout (hosting, website builder, email you don't need), and turning on auto-renew so the name never lapses.
- Ends with a "Now connect it" button that drops them into the connect step below with the domain box ready.

**"I already own one"**
- They type the domain; we show the exact records to add, each with a copy button, and the two rows written the way GoDaddy actually labels them (Type / Name / Value / TTL).
- Provider-specific click-path for GoDaddy (My Products → DNS → Add), with a short note for Namecheap, Hostinger and Cloudflare users.
- A "Check my records" button that tells them clearly: not found yet, found but still spreading, or live and secured.
- Status chips on the domain row: Added → Waiting on records → Live → Secured, with a friendly explanation under each.
- We email them the moment it goes live, and remind them once after 48 hours if the records still aren't there.

We do not sell or buy domains on their behalf — they buy at GoDaddy in their own name and keep ownership.

## Note on payments

Payment-related emails are wired to the existing billing webhook. They will fire as soon as a working payment provider is back in place; nothing here depends on which provider you pick.

## Technical notes

- `src/routes/_authenticated/admin.tsx`: row selection state, shadcn `Checkbox` + `AlertDialog`, sequential calls to `deleteCustomer`, per-item results, query invalidation. `src/lib/admin.functions.ts` unchanged apart from returning a clearer refusal reason.
- New `src/lib/emails/` with a shared shell plus one render function per email; `src/lib/gmail.server.ts` gains a plain-text part and keeps logging to `sent_emails`. Trigger points: onboarding finish, publish action in `website.tsx`, `public-site.functions.ts` (enquiry), `whop-webhook.ts` / `whop-sync.server.ts` (succeeded, failed, lapsed), ticket message insert, domain verification.
- Domain verification: new server function resolving A/TXT via DNS-over-HTTPS, updating `domains.status`/`ssl_active`, called by the "Check my records" button; reminder/live emails sent from the same function.
- `src/routes/_authenticated/domains.tsx` rebuilt around the two routes; `src/routes/_authenticated/connect-domain.tsx` becomes the full GoDaddy buying + connecting guide.
- No schema migration needed; existing `domains`, `sent_emails` and `billing_events` tables cover it.
