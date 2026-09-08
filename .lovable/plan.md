# Move WebWarheads hosting to Lovable

Lovable hosts and serves the site, GitHub stays the code history, and the existing backend (database, logins, files) stays exactly as it is. Nothing about how the app works changes for customers.

## What happens

1. **Point the domain at Lovable**
   - Connect `webwarheads.com` and `www.webwarheads.com` through the in-chat domain card, which shows the exact DNS records to add at the DNS provider.
   - Pick one as the main address so the other redirects to it.
   - Once verified, Lovable issues the security certificate automatically.

2. **Make sign-in work on the live address**
   - Set the login system's site address to `https://webwarheads.com` and allow `https://webwarheads.com/**` as a return address.
   - Add the same address to the Google sign-in configuration so "Continue with Google" stops landing on a missing page.
   - Keep the existing return-to-home behaviour after login, which works on any host.

3. **Drop the old-host-specific setup**
   - Remove the deployment instructions written for the previous host from the project notes and roadmap, and replace them with the Lovable + GitHub + backend flow.
   - Keep the plain `npm` setup and the lock file, so the code stays portable and can still be run elsewhere if ever needed.
   - Keep the customer-facing "connect your own domain" help page; it stays useful and only mentions registrars as examples.

4. **Check everything still works after the switch**
   - Sign up, log in with email, log in with Google, staff login, onboarding, saving and previewing a site, leads, and the admin pages.
   - Confirm server-side actions and emails still run on the live address.

5. **Publish**
   - Publish from Lovable so the live address serves the current build; future changes go live by publishing again, while backend changes apply immediately.

## Notes on the free customer subdomains

Addresses like `sparkle.webwarheads.com` need a wildcard DNS record. On Lovable hosting each subdomain has to be connected individually, so the plan keeps the existing `/s/{name}` public address as the default free option and treats per-customer subdomains as a later step. Say the word if you want that reworked now.

## Technical details

- No hosting adapter or server config changes are needed: the app already builds with the standard TanStack Start build, which Lovable serves directly. `npm start` remains for portability but is unused by Lovable.
- Environment values used at build/run time on Lovable are already provisioned; `.env.example` stays as documentation and drops the host-specific `PORT` note.
- `APP_URL` continues to default to `https://webwarheads.com` for invitation links.
- Auth site URL and redirect allowlist are updated via the backend auth configuration, not in code.
