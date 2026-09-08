DROP TABLE IF EXISTS public.billing_webhook_events;
ALTER TABLE public.plans DROP COLUMN IF EXISTS whop_plan_id, DROP COLUMN IF EXISTS whop_checkout_url;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS whop_membership_id, DROP COLUMN IF EXISTS whop_plan_id;
DELETE FROM public.activity_logs WHERE action LIKE 'whop:%';