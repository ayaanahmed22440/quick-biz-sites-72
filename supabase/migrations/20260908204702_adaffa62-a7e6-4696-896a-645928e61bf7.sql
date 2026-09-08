DROP POLICY IF EXISTS businesses_select ON public.businesses;
CREATE POLICY businesses_select ON public.businesses FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR is_business_member(auth.uid(), id) OR is_platform_staff(auth.uid()));