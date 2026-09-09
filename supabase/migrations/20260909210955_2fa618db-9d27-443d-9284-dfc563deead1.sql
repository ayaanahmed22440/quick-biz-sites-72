CREATE TABLE public.sent_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sent_emails TO authenticated;
GRANT ALL ON public.sent_emails TO service_role;

ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read sent emails"
ON public.sent_emails FOR SELECT TO authenticated
USING (public.is_platform_staff(auth.uid()));

CREATE INDEX sent_emails_created_at_idx ON public.sent_emails (created_at DESC);