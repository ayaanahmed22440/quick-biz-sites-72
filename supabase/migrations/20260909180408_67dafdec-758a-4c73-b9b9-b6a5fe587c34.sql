-- Industries (flexible categories)
CREATE TABLE public.industries (
  slug text PRIMARY KEY,
  name text NOT NULL,
  plural_label text NOT NULL,
  default_service text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.industries TO anon;
GRANT SELECT ON public.industries TO authenticated;
GRANT ALL ON public.industries TO service_role;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Industries are readable by everyone" ON public.industries FOR SELECT USING (true);

INSERT INTO public.industries (slug, name, plural_label, default_service, sort_order) VALUES
  ('landscaping','Landscaping','Landscaping & lawn care','Landscaping',1),
  ('cleaning','Cleaning','Cleaning services','House cleaning',2),
  ('roofing','Roofing','Roofing','Roof replacement',3),
  ('plumbing','Plumbing','Plumbing','Plumbing repairs',4),
  ('renovation','Renovation','Renovation & remodeling','Kitchen remodeling',5),
  ('construction','Construction','Construction','General contracting',6),
  ('junk_removal','Junk Removal','Junk removal','Junk removal',7);

-- Business branding + extras
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hours_note text;

-- Customer reviews shown on their website
CREATE TABLE public.business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  location text,
  rating smallint NOT NULL DEFAULT 5,
  quote text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_reviews TO authenticated;
GRANT ALL ON public.business_reviews TO service_role;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage their reviews" ON public.business_reviews FOR ALL TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_platform_staff(auth.uid()))
  WITH CHECK (public.is_business_member(auth.uid(), business_id) OR public.is_platform_staff(auth.uid()));

-- Media library ordering + storage reference
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer;

-- Domain checking state
ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS ssl_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_token text;

-- Extra website lifecycle states
ALTER TYPE public.website_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE public.website_status ADD VALUE IF NOT EXISTS 'unpublished';

-- Extra lead statuses
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'quote_sent';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'booked';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'completed';