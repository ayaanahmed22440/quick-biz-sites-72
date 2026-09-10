ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS polar_product_id text;
ALTER TABLE public.checkout_sessions ADD COLUMN IF NOT EXISTS polar_checkout_id text;
ALTER TABLE public.checkout_sessions ALTER COLUMN whop_plan_id DROP NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS polar_subscription_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS polar_customer_id text;
CREATE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_idx ON public.subscriptions (polar_subscription_id);
CREATE INDEX IF NOT EXISTS checkout_sessions_polar_checkout_id_idx ON public.checkout_sessions (polar_checkout_id);