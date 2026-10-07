CREATE TABLE public.email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_key text NOT NULL UNIQUE,
  business_id uuid,
  kind text NOT NULL,
  recipient text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_reminders TO service_role;
GRANT SELECT ON public.email_reminders TO authenticated;
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view reminder log" ON public.email_reminders FOR SELECT TO authenticated USING (public.is_platform_staff(auth.uid()));
CREATE INDEX email_reminders_business_idx ON public.email_reminders(business_id);
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;