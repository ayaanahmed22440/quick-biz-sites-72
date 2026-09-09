CREATE OR REPLACE FUNCTION public.can_access_media_path(_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first text;
  v_id uuid;
BEGIN
  v_first := split_part(_path, '/', 1);
  BEGIN
    v_id := v_first::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  RETURN public.is_business_member(auth.uid(), v_id) OR public.is_platform_staff(auth.uid());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_media_path(text) FROM anon;

CREATE POLICY "media read own business"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'business-media' AND public.can_access_media_path(name));

CREATE POLICY "media insert own business"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-media' AND public.can_access_media_path(name));

CREATE POLICY "media update own business"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'business-media' AND public.can_access_media_path(name))
WITH CHECK (bucket_id = 'business-media' AND public.can_access_media_path(name));

CREATE POLICY "media delete own business"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'business-media' AND public.can_access_media_path(name));