# No-password onboarding with magic-link login

Remove the account screen from the start of the journey. People go straight into the questionnaire, and their account is created quietly the moment they type the email the site already asks for. Logging in later happens through a link sent to that inbox — no passwords.

## New flow

```text
CTA on any page  ->  questionnaire (trade, name, service, ... , email)
                         |
              email entered -> account created silently, session started
                         |
                 rest of questionnaire (unchanged)
                         |
                 payment at the end (unchanged)
```

## What changes

1. **CTA buttons** on the homepage, pricing, blog, cleaning page, and header now go straight to the questionnaire instead of the sign-up screen. "Log in" links stay as they are.
2. **The questionnaire opens without an account.** Answers are already kept in the browser as you go, so nothing is lost before the account exists.
3. **At the existing "Where should enquiries land?" step**, pressing Continue creates the account behind the scenes with that email and signs the person in. No password, no extra field, no extra screen. A short "Setting things up…" state shows while it happens.
4. **If that email already belongs to an account**, we do not sign them in automatically (that would let anyone take over an account by typing someone's address). Instead the step shows: "You already have an account — we've emailed you a link to continue", and the link drops them back into the questionnaire with their answers intact.
5. **Login page** becomes email-only: enter your email, get a link, click it, you're in. The password box, the "create an account" toggle, and "forgot password" are removed from the user-facing page. Google and Apple sign-in stay exactly as they are.
6. **The link email** reuses the existing branded magic-link template already in the project.

## What does not change

- Every question, its order, wording, validation, autosave, preview, logo upload and review steps.
- Everything written to the database for a business, and how the site is generated and published.
- Payment: plan selection, Polar checkout, the webhook, activation, and the return page are untouched.
- Existing customers with passwords keep their accounts; they simply log in by link from now on.

## Technical notes

- New public server function `src/lib/signup.functions.ts`:
  - `startOnboardingAccount({ email })` — validated with zod, rate-limited per IP/email via the existing `rate-limit.server.ts` helper.
  - Uses `supabaseAdmin` (imported inside the handler) to look up the email:
    - unknown email -> `auth.admin.createUser({ email, email_confirm: true })`, then `auth.admin.generateLink({ type: 'magiclink' })` and return the `token_hash` (`{ status: 'created', tokenHash }`) so the client calls `supabase.auth.verifyOtp({ type: 'magiclink', token_hash })` to establish the session in-place.
    - known email -> no token returned; send the magic link by email instead (`{ status: 'existing' }`).
  - Never returns a token for an email that already has an account.
- `src/routes/onboarding.tsx`: drop the `beforeLoad` auth gate (stays `ssr: false`). Add an `ensureAccount()` call inside `next()` when `step.key === 'email'`, before the existing business-creation step at `city`. `ensureBusiness()` keeps using the now-present session, so RLS inserts are unchanged.
- `src/routes/auth.tsx`: replace password/signup modes with a single `signInWithOtp({ email, options: { emailRedirectTo: origin + '/auth/callback' } })` form; keep the existing Google/Apple handlers and the `?plan=` handling. `/reset-password` stays in place for any outstanding recovery links.
- `src/routes/auth.callback.tsx`: also resume to `/onboarding` when a saved onboarding draft exists.
- Magic-link delivery already works through the scaffolded auth-email webhook; no email infrastructure changes.
- `supabase--configure_auth` is not needed — no new provider; email sign-in is already on.
