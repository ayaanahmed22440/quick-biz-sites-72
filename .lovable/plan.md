# Bot / card-testing protection for checkout

Card testing is when a bot runs stolen card numbers through a checkout to see which ones work. Card data never touches our site (Polar hosts the card form), so the goal is to stop bots from generating unlimited checkout attempts through us, and to shut an attacker down automatically when a burst of failures happens.

## What changes

1. **Throttle checkout starts.** A signed-in account can start a limited number of checkouts in a window (e.g. 5 per 15 minutes per account, 10 per hour per network address). Beyond that they see a friendly "too many attempts, try again in a few minutes" message instead of a new payment link. Uses the same throttle mechanism already protecting the contact form and lead forms.

2. **One live payment link at a time.** If a customer already has a fresh, unused payment link for the same plan, reuse it instead of creating a new one. Normal customers never notice; bots lose the ability to mint links in a loop.

3. **Auto-cooldown on repeated failures.** Failed or declined payment events coming back from the payment provider get counted per account. After a few failures in a short window, new checkout attempts for that account are blocked for a cooldown period and an alert email goes to the admin address.

4. **Account-level gates.** Checkout requires a confirmed email address on the account, and accounts created within the last few minutes get a short delay before they can start a checkout. This removes the "sign up, blast cards, repeat" loop.

5. **Admin visibility.** The admin area gets a small "Payment attempts" panel: recent checkout attempts, failure counts, and any account currently in cooldown, with a manual "clear cooldown" control for false positives.

## Explicitly unchanged

- Polar checkout creation, webhook verification, subscription sync, plan mapping and the return/confirmation page keep their current behaviour for a normal customer.
- No design, pricing, routing or dashboard changes.

## Technical notes

- Reuse `enforceRateLimit` / `callerKey` from `src/lib/rate-limit.server.ts` (service-role `rate_limit_hits` table, fails open on storage errors) inside the `startCheckout` handler in `src/lib/billing.functions.ts`, keyed on both `userId` and caller IP.
- Link reuse: query `checkout_sessions` for a `pending` row with the same `business_id` + `plan_id` created inside the last ~15 minutes and a stored `checkout_url`; return it instead of calling Polar again.
- Failure counting: in `src/routes/api/public/polar-webhook.ts`, the existing `order.payment_failed` / `subscription.past_due` branch also records a failure hit for the business; `startCheckout` refuses while that count is over the threshold in the cooldown window. No schema change needed if failures are recorded in `rate_limit_hits` with a dedicated bucket.
- Email confirmation and account-age checks read from the auth claims already available in `context`.
- Admin panel reads recent `checkout_sessions` plus failure buckets through an existing staff-only server function pattern in `src/lib/admin.functions.ts`.
- Thresholds live in one constants block so they are easy to tune.

## Verification

- Typecheck and build.
- Simulated rapid checkout calls hit the limit and return the friendly message.
- A single normal checkout still produces a working Polar link and activates on webhook.
