GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.plans TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.businesses TO service_role;