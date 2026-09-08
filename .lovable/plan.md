# Rebuild Whop payments with embedded checkout

## What the audit confirmed

- The current Billing page is only a link to Whop’s hosted checkout. It is not embedded checkout.
- The current webhook verifier is incompatible with Whop’s documented Standard Webhooks format. Whop signs `webhook-id.webhook-timestamp.raw-body` and sends the result in `webhook-signature` as `v1,<base64 signature>`.
- The current handler looks for old payload fields (`action` / `event`) instead of Whop’s current event envelope (`type`, `data`).
- The current configured event names are outdated. Current Whop events include `membership.activated` and `membership.deactivated`, not `membership.went_valid` / `membership.went_invalid`.
- No real customer subscription has been written. The only Whop activity row is the earlier synthetic signature test.
- The six monthly/yearly plan IDs are already stored, as are `WHOP_API_KEY` and `WHOP_WEBHOOK_SECRET`.

## Build

1. **Replace hosted checkout with the official embed**
   - Install Whop’s official checkout package.
   - Open checkout inside WebWarheads instead of sending customers to a Whop checkout page.
   - Use the selected existing monthly/yearly plan ID.
   - Prefill and lock the signed-in WebWarheads email so payment cannot attach to a different customer account.
   - Keep promo-code support inside the embed.
   - Use WebWarheads’ Billing page as the return destination for payment methods that temporarily leave the embed.

2. **Create each checkout securely on the server**
   - Generate a Whop checkout configuration/session for the selected plan.
   - Attach the WebWarheads `business_id`, authenticated user ID, internal plan ID, and customer email as metadata.
   - Return only the checkout session ID to the browser; never expose the Whop API key.

3. **Replace webhook verification completely**
   - Verify `webhook-id`, `webhook-timestamp`, and `webhook-signature` against the unmodified request body.
   - Enforce Whop’s five-minute timestamp window to prevent replay attacks.
   - Parse the current `type`/`data` envelope only after verification.
   - Make delivery idempotent by recording each Whop webhook ID and ignoring duplicates.

4. **Use current subscription events**
   - `payment.succeeded` — confirm the initial successful payment and metadata.
   - `payment.failed` — record payment failure without granting access.
   - `membership.activated` — create or reactivate the subscription.
   - `membership.deactivated` — remove active access.
   - `membership.cancel_at_period_end_changed` — reflect scheduled cancellation without removing access early.

5. **Make completion reliable**
   - On embedded checkout completion, show “Confirming payment” and refresh the customer’s subscription state.
   - Use the returned receipt/payment identifier for a server-side verification fallback if webhook delivery is delayed.
   - Never unlock publishing from browser state, a redirect query parameter, or an unverified callback.
   - Keep the existing centralized entitlements and pay-to-publish gate.

6. **Test the full path before asking for another customer test**
   - Run a locally signed Standard Webhooks request against the new handler.
   - Confirm invalid signatures fail, valid signatures pass, duplicate deliveries are ignored, and metadata attaches the correct business.
   - Test the embedded checkout render and monthly/yearly plan selection on desktop and phone.
   - Publish the completed integration, send a Whop dashboard test event, and inspect the stored delivery/subscription result.

## What I need from you

Nothing else right now. The six plan IDs, API key, and webhook secret are already present.

After the rebuild is published, Whop must have one webhook pointed at:

`https://webwarheads.com/api/public/whop-webhook`

Subscribe it to exactly these five events:

- `payment.succeeded`
- `payment.failed`
- `membership.activated`
- `membership.deactivated`
- `membership.cancel_at_period_end_changed`

Use Whop’s current/latest API version when creating it. If rebuilding the webhook generates a new signing secret, that new value must replace the stored `WHOP_WEBHOOK_SECRET` before testing.

## Important limitation

Embedding keeps checkout on WebWarheads and lets us prefill/lock the customer’s email, but it cannot guarantee Whop will never request identity verification or payment authentication. Whop may still require verification for fraud prevention, account security, or a payment method such as 3-D Secure. The integration will remove the unnecessary redirect/login mismatch; it will not bypass a security challenge imposed by Whop.
