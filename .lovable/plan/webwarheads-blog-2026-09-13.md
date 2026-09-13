# WebWarheads Blog

Add a proper blog: admins write and publish posts with images and SEO controls, visitors read them on a well-designed public blog.

## What admins get

A new "Blog" area in the admin section (staff only), sitting alongside Clients, Templates and Emails.

- List of all posts with status (draft / published), date, author and a search box
- Create / edit screen with:
  - Title, URL slug (auto-filled from title, editable)
  - Short excerpt
  - Cover image upload (reuses the existing image upload used in onboarding)
  - Body written in a simple rich editor: headings, bold/italic, lists, links, quotes, and inline images
  - Category and tags
- SEO panel on the same screen:
  - Meta title and meta description with live character counters and a Google-result preview
  - Social share image (falls back to the cover image)
  - Canonical URL override
  - "Allow search engines to index this post" toggle
  - Keyword field used in the page structure
- Save draft, Publish, Unpublish, Duplicate, Delete (delete behind the same checkbox confirmation used for clients)

## What visitors get

- `/blog` — magazine-style index: large featured post, then a clean card grid, category filter, pagination
- `/blog/{slug}` — article page: cover image, title, author and date, reading time, readable article column, inline images, share links, related posts, and a call-to-action card pointing to the $37 offer
- Styling follows the existing WebWarheads brand (Poppins headings, Work Sans body, existing color tokens) — no new design language

## Visibility work

- Per-post title/description/social tags, canonical link, and Article structured data
- Published posts added to the sitemap automatically
- Drafts and non-indexable posts excluded from both the sitemap and search engines

## Technical notes

- New table `public.blog_posts` (title, slug unique, excerpt, body, cover image, category, tags, author id, status, published_at, meta_title, meta_description, og_image, canonical_url, indexable, timestamps) with GRANTs; RLS: anon/authenticated can SELECT published rows only, platform staff full access via `is_platform_staff`.
- Public reads via a server function using the publishable-key client (`src/lib/blog.functions.ts`); admin writes via `createServerFn` with `requireSupabaseAuth` plus a staff check.
- Routes: `src/routes/blog.tsx` (index), `src/routes/blog.$slug.tsx` (post), `src/routes/_authenticated/admin-blog.tsx` (list) and `src/routes/_authenticated/admin-blog.$postId.tsx` (editor). Static `/blog` takes precedence over the existing `/$slug` customer-site route.
- Images stored in the existing private media bucket and served through the existing `/api/public/media/*` proxy.
- Sitemap route extended with published, indexable post slugs.
- Nothing touched in checkout, Polar, auth, domains or the template engine.
