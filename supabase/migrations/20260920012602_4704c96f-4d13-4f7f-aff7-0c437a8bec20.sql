ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'byo',
  ADD COLUMN IF NOT EXISTS purchase_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS polar_checkout_id text,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
  ADD COLUMN IF NOT EXISTS records_released boolean NOT NULL DEFAULT false;

UPDATE public.domains SET records_released = true WHERE records_released = false;