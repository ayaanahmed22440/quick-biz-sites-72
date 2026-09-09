INSERT INTO public.templates (slug, name, niche, description, status, current_version)
VALUES
  ('cleaning-01', 'Cleaning 01 — Fresh Split', 'cleaning', 'Bright, trust-led layout with the quote form beside the headline.', 'published', 1),
  ('landscaping-01', 'Landscaping 01 — Open Air', 'landscaping', 'Full-width garden photography with a bold headline over the image.', 'published', 1),
  ('roofing-01', 'Roofing 01 — Storm Ready', 'roofing', 'Strong, urgent layout built around emergency callouts and inspections.', 'published', 1),
  ('plumbing-01', 'Plumbing 01 — Call Out', 'plumbing', 'Phone-first layout for urgent jobs, with the quote form right at the top.', 'published', 1),
  ('renovation-01', 'Renovation 01 — Showcase', 'renovation', 'Photo-led design that leads with finished rooms and a premium feel.', 'published', 1),
  ('construction-01', 'Construction 01 — Groundwork', 'construction', 'Sturdy, contractor-grade layout with credentials up front.', 'published', 1),
  ('junk-removal-01', 'Junk Removal 01 — Clear Out', 'junk_removal', 'Fast, friendly layout built around same-day pickups and simple pricing.', 'published', 1)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    niche = EXCLUDED.niche,
    description = EXCLUDED.description,
    status = EXCLUDED.status;