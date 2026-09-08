CREATE POLICY "billing_webhook_events_service_only"
ON public.billing_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);