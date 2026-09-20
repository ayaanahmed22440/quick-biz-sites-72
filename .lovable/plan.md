# Simpler domain flow for customers

## First: where the automation ceiling is

Short answer: **the actual domain purchase cannot be triggered from our backend.** Someone on our team has to click through Lovable's own buy-and-connect flow once per customer.

Why:
- Lovable's domain purchase and domain connect are approval cards inside the Lovable editor — a person confirms them and pays on a hosted checkout. There is no public endpoint we can call.
- Lovable's public API covers workspaces, projects, publishing, analytics, members and security. Domains are not in it.

What we *can* automate end to end:
- A good availability check on our own (public RDAP registry lookup — free, no key, tells us "registered / available" reliably for .com, .co.uk, .net and friends).
- Taking the $20 payment through Polar.
- Creating the internal task, notifying the team, and emailing the customer.
- Tracking and flipping the customer-visible status.
- The final DNS verification for customers who bring their own domain.

So per customer, the manual work is about 2 minutes in Lovable: buy/connect the domain, paste the token (or nothing, for purchased domains). Everything around it is automated.

## What the customer sees

The Domains page becomes two clear choices. No DNS records, no tokens, no IP addresses anywhere on the customer side until we decide to show them.

**Option 1 — "Buy a domain for me — $20 one-off"**
1. They type the name they want.
2. We check availability instantly and show taken/available, plus a couple of suggestions when it's taken.
3. Available name → "Get this domain — $20" opens a Polar checkout.
4. Paid → status card: "Your domain will be connected within 24 hours. We'll email you the moment it's live."
5. When our team finishes it, status flips to Live with a link to their site.

**Option 2 — "I already have a domain"**
1. They type the domain they own.
2. Row created instantly, shown as "Pending — we're setting this up for you. Nothing for you to do yet."
3. Our team does the Lovable connect step and saves the token.
4. Then either: we flip it to "Action needed" and show the two records with copy buttons, or we keep it white-glove and leave it pending while we handle DNS with them. Per-domain toggle in the admin.

## What the team sees

The existing admin Domains section gains a **queue** at the top: every domain awaiting action, newest first, with:
- which customer, which option they picked, whether the $20 is paid
- a "Mark as purchased & connected" action for option 1
- token field + "Release records to customer" toggle for option 2
- existing notes, re-check and remove actions unchanged

## Technical notes

- `domains` table: add `request_type` (`purchase` | `byo`), `purchase_status` (`none` | `awaiting_payment` | `paid` | `fulfilled`), `checkout_session_id`, `records_released` (bool). Existing columns and statuses stay as they are.
- Availability: new server function hitting `https://rdap.org/domain/<name>` — 404 means available, 200 means registered. Cached briefly, rate-limited per user like the other public-facing functions.
- Payment: a new $20 one-time Polar product, checkout created server-side exactly like the plan checkout (same `createPolarCheckout`, metadata carries `domain_request_id`). The webhook gains one branch for that product: mark `purchase_status = 'paid'`, notify the team, email the customer the 24-hour message. Subscription handling is untouched.
- Notifications: reuse the existing Gmail admin email path plus the admin notification bell.
- Customer-facing DNS record display moves behind `records_released`; `/connect-domain` guide is trimmed to the two options and the buying guide moves into the option 1 flow.
- Nothing about checkout for plans, Polar subscription sync, or site serving changes.
