CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_invitations_staff_roles_only CHECK (role IN ('admin', 'staff'))
);

CREATE UNIQUE INDEX staff_invitations_pending_email_key
  ON public.staff_invitations (lower(email))
  WHERE accepted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_invitations TO authenticated;
GRANT ALL ON public.staff_invitations TO service_role;

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view staff invitations"
ON public.staff_invitations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create staff invitations"
ON public.staff_invitations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND invited_by = auth.uid());

CREATE POLICY "Admins can update staff invitations"
ON public.staff_invitations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete staff invitations"
ON public.staff_invitations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_staff_invitation()
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  invitation public.staff_invitations%ROWTYPE;
  account_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT lower(email) INTO account_email
  FROM auth.users
  WHERE id = auth.uid();

  SELECT * INTO invitation
  FROM public.staff_invitations
  WHERE lower(email) = account_email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF invitation.id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), invitation.role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.staff_invitations
  SET accepted_at = now(), updated_at = now()
  WHERE id = invitation.id;

  RETURN invitation.role;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_staff_invitation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_staff_invitation() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_staff_invitation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_staff_invitation_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_staff_invitation_updated_at() TO service_role;

CREATE TRIGGER update_staff_invitations_updated_at
BEFORE UPDATE ON public.staff_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_staff_invitation_updated_at();