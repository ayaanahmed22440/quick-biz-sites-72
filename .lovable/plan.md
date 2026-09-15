# Full Facebook Pixel event setup

Right now the pixel only sends three things: one page view when the site first loads, a "Lead" when someone starts onboarding, and a "Purchase" after a confirmed payment. That leaves gaps — no page views when people move between pages, nothing when someone signs up, and nothing when they open checkout. This plan wires up the complete set using Meta's standard events.

## What gets tracked

| Moment | Event | Details sent |
|---|---|---|
| Every page (including moving between pages) | PageView | — |
| Landing on pricing or the cleaning ads page | ViewContent | page name |
| Someone starts building a website (onboarding) | Lead | — |
| Account created (signup / Google / Apple) | CompleteRegistration | — |
| Clicking a plan button to open Polar checkout | InitiateCheckout | plan name, price, USD |
| Payment confirmed on the return page | Purchase | plan price, USD, order ID (already live) |
| Contact / support form sent | Contact | — |

Every event still respects the cookie notice: nothing fires until the visitor is allowed to be measured, exactly as today.

Each event also carries a unique event ID so a future server-side (Conversions API) copy can be matched up instead of double-counting.

## Fixing the page-view gap

The site is a single-page app, so moving from the homepage to pricing never told Facebook anything. A router subscription will send a page view on each real navigation, skipping the duplicate on first load.

## Duplicate protection

InitiateCheckout fires once per click, Purchase stays once per order (already keyed by order ID), and CompleteRegistration fires once per account using a stored flag — so refreshes and back-button use don't inflate numbers.

## Technical notes

- `src/lib/meta-pixel.ts`: add `trackEvent(name, params?, eventId?)` helper wrapping `fbq('track', ...)` with the optional `eventID`, generate IDs via `crypto.randomUUID()`, keep the existing `?fbdebug=1` console gating for all events, and add named helpers (`trackViewContent`, `trackInitiateCheckout`, `trackCompleteRegistration`, `trackContact`, `trackPageView`).
- `src/routes/__root.tsx`: subscribe to the router's navigation event to call `trackPageView()` after hydration; skip the initial load since `startMetaPixel()` already sends it.
- `src/components/billing/PlanChooser.tsx`: fire InitiateCheckout in `choose()` before calling `startCheckout`, with `content_name` = plan id, `value` from `PLAN_COPY`/`yearlyPrice`, `currency: "USD"`.
- `src/routes/auth.tsx` + `src/routes/auth.callback.tsx`: fire CompleteRegistration after a successful new-account creation only (guarded by a `localStorage` flag keyed on user id).
- `src/routes/pricing.tsx` and `src/routes/cleaning-business-websites.tsx`: fire ViewContent on mount.
- `src/routes/contact.tsx` and the support form: fire Contact after a successful submit.
- No changes to checkout logic, Polar, auth flows, routing, or UI.

## Verification

Run the site with `?fbdebug=1`, walk the flow (home → pricing → signup → onboarding → plan click) and confirm each payload in the console, then confirm in Meta Events Manager → Test events.
