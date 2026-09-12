# Expand the WebWarheads template library

## Goal

Add all 50 requested business niches as production-ready choices while preserving the approved long-form WebWarheads template design, editor behavior, publishing flow, and payment flow.

## Template library

- Add the requested niches under five categories: Home Services, Automotive, Beauty & Fitness, Local Services, and Professional / Local Businesses.
- Keep the current modular template renderer and its approved long-form page structure. Each niche will be a data-driven preset rather than a separate hardcoded page.
- Give every new niche its own business-specific copy, services, trust points, calls to action, sample business details, locations, and review content.
- Assign a deliberate accent color and one of the existing approved page compositions to every niche, creating visible variety without changing the shared design rules.
- Keep all existing seven niches and their working customer sites unchanged.

## Images

- Generate four relevant, realistic images for each new niche: one main image, one team/about image, and two completed-work images.
- Use a consistent premium commercial-photography direction while keeping the subject matter accurate to each trade.
- Optimize the 200 new images for fast loading and use lazy loading where appropriate.
- Ensure every onboarding, customer, admin, and homepage preview resolves to the correct niche imagery instead of falling back to cleaning content.

## Onboarding experience

- Replace the long flat niche grid with a searchable, categorized selector designed for both phones and desktops.
- Search by business type and useful alternate terms, with a clear no-results state and category headings.
- Preserve the selected niche, automatically apply its correct accent color, and continue through the existing onboarding flow normally.
- Keep the existing shared Back button; it already works on every step after the first, so no duplicate control will be added.

## Preview surfaces

- Show every niche in the admin template gallery with its correct sample business, images, layout, and accent.
- Keep the homepage showcase curated to featured niches only, rather than loading all 57 options into the public selector.
- Keep customer previews connected to the same preset source so onboarding and editor previews match admin previews exactly.

## Data and scalability

- Organize the niche catalogue by category and separate catalogue metadata from rendering logic so future niches remain easy to add.
- Add matching published template records for every new preset so selection, editor loading, and admin management recognize them.
- Add development safeguards against missing niche copy or preview data instead of silently showing the cleaning template.

## Validation

- Verify every new niche has four working images, unique niche-specific content, a valid accent, and a recognized template record.
- Test onboarding search, category filtering, selection, Back navigation, autosave, and continuation on desktop and mobile.
- Test representative templates from every category in onboarding, customer editor, admin preview, and published-site rendering.
- Check image failures, unexpected cleaning fallbacks, horizontal overflow, console errors, type errors, and the final production build.
- Leave authentication, Polar checkout, publishing, domains, Gmail, and other existing product behavior untouched.
