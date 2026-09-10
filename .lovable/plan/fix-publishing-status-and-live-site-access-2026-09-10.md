# Fix publishing status and live-site access

## What will change
- Make the customer dashboard read the real website record instead of showing permanent placeholder text.
- Show the correct published/draft state, live-site link, lead count, and completed publishing checklist state.
- Add a clear **Live site** tab/link in the website editor after publishing, while keeping **Edit** and **Preview** easy to access.
- Refresh the editor and dashboard data immediately after publishing so the new state appears without reloading.

## Safety
- Do not modify Polar checkout, webhook, subscription synchronization, plan mappings, or payment secrets.
- Preserve the existing website editor and public-site route.

## Verification
- Check desktop and phone layouts.
- Verify the published state, live link, and checklist are driven by stored website data.
- Confirm the project build remains healthy.
