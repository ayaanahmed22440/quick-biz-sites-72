REVOKE EXECUTE ON FUNCTION public.can_access_media_path(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_media_path(text) TO authenticated, service_role;