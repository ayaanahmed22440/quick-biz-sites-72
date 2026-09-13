CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_image_alt text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  meta_title text,
  meta_description text,
  og_image_url text,
  canonical_url text,
  focus_keyword text,
  indexable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_status_published_at_idx ON public.blog_posts (status, published_at DESC);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are readable by everyone"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Staff can read all posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.is_platform_staff(auth.uid()));

CREATE POLICY "Staff can create posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_staff(auth.uid()));

CREATE POLICY "Staff can update posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.is_platform_staff(auth.uid()))
WITH CHECK (public.is_platform_staff(auth.uid()));

CREATE POLICY "Staff can delete posts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.is_platform_staff(auth.uid()));

CREATE TRIGGER blog_posts_updated
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();