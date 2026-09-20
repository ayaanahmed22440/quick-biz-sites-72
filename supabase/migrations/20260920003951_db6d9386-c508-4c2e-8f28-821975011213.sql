ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS reminded_at timestamp with time zone;