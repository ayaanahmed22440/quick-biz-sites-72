ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS whop_membership_id text,
  ADD COLUMN IF NOT EXISTS whop_plan_id text,
  ADD COLUMN IF NOT EXISTS whop_user_id text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_business_id_key ON public.subscriptions (business_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_whop_membership_id_key ON public.subscriptions (whop_membership_id) WHERE whop_membership_id IS NOT NULL;

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS whop_plan_id text;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'whop',
  event_id text NOT NULL,
  event_type text NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_key ON public.billing_events (provider, event_id);

GRANT SELECT ON public.billing_events TO authenticated;
GRANT ALL ON public.billing_events TO service_role;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read billing events" ON public.billing_events
  FOR SELECT TO authenticated USING (public.is_platform_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  whop_plan_id text NOT NULL,
  return_path text NOT NULL DEFAULT '/dashboard',
  status text NOT NULL DEFAULT 'pending',
  checkout_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.checkout_sessions TO authenticated;
GRANT ALL ON public.checkout_sessions TO service_role;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own checkout sessions" ON public.checkout_sessions
  FOR SELECT TO authenticated USING (public.is_business_member(auth.uid(), business_id) OR public.is_platform_staff(auth.uid()));
CREATE POLICY "Members create own checkout sessions" ON public.checkout_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_business_member(auth.uid(), business_id));

CREATE TRIGGER checkout_sessions_updated BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();