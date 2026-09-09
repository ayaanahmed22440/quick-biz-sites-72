# Gmail sending + a proper onboarding experience

Two pieces of work: hook your Gmail up so WebWarheads can send mail, and rebuild the onboarding flow so it feels like a modern product instead of a form.

## 1. Send email through your Gmail

I'll open a Gmail connect card in the chat — you sign in with the Google account you want mail to come from, and that's it. No SMTP details, no passwords typed into the app.

Once connected:
- Lead alerts, welcome mail, ticket replies and billing notices send from your Gmail address.
- Every send is written to the "Emails sent" table in Admin so you can see who got what.
- Failures show up there too instead of disappearing.

One honest caveat: sign-in codes and password-reset links come from the login system itself, not from the app, so those stay on the built-in sender until the domain records are added. Everything else moves to Gmail immediately.

## 2. Rebuild the onboarding flow

The current version is a card with a question and a preview bolted next to it. Replacing it with a full-screen guided setup:

**Look and feel**
- Own full-screen layout — no sidebar, no dashboard chrome.
- Slim progress rail at the top with named stages (Trade, Business, Services, Look, Reviews) rather than "Question 4 of 12".
- One question per screen, large type, generous space, smooth slide between steps.
- Enter moves forward, Back never loses an answer, everything autosaves so closing the tab is safe.
- Keyboard and mobile both first-class; on phones the preview becomes a "See my site" sheet instead of being hidden.

**Trade picker**
Large image cards for the seven trades with a hover/selected state, showing the real template photography.

**Live preview that actually reads as a website**
- Browser-chrome frame (dots + your future address `webwarheads.com/yourbusiness`) around the real site.
- Desktop / tablet / phone toggle.
- Preview scales to fit rather than being cropped, and updates as you type.
- A short skeleton on first paint instead of a blank frame.

**Plan step**
The plan screen gets rebuilt as three proper pricing cards — monthly/yearly toggle, feature lists, one highlighted as recommended — reading live from your plans table and tied to the business just created, which also fixes the current wrong-business bug. Nothing is charged here; payment still happens at publish.

**Ending**
A finish screen: your site thumbnail, the address it will live at, and two buttons — "Open my editor" and "Publish now".

## Technical notes

- New `src/routes/onboarding.tsx` full-bleed route (authenticated, outside `AppShell`); old `_authenticated/onboarding` redirects to it so existing links keep working.
- Steps become a declarative array with `stage`, validation and render, so adding a question is a one-line change.
- Draft state moves to a small reducer + `localStorage` with a debounced Supabase write; business row still created at the name step so uploads work.
- `PreviewFrame` gains `scale`, device presets and a chrome wrapper; reused by onboarding, `/website` and admin template previews so they all improve at once.
- `PlanChooser` takes an explicit `businessId` prop instead of picking the earliest business.
- Whop checkout, webhook and entitlement code are untouched.
- Gmail: `standard_connectors--connect` with `google_mail`, then a server-side `sendEmail` helper calling the connector gateway; all existing email templates render through it unchanged.
