CREATE TABLE public.billing_webhook_events (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_created_at TIMESTAMPTZ,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.billing_webhook_events TO service_role;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER billing_webhook_events_updated
  BEFORE UPDATE ON public.billing_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();