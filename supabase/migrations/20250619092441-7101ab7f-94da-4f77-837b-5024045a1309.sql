
-- First, let's create a debug function to see what's in the JWT claims
CREATE OR REPLACE FUNCTION public.debug_auth_info()
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'current_setting_jwt_claims', current_setting('request.jwt.claims', true),
    'parsed_jwt_claims', current_setting('request.jwt.claims', true)::json,
    'email_from_jwt', current_setting('request.jwt.claims', true)::json->>'email',
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'backoffice_user_exists', EXISTS (
      SELECT 1 FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ),
    'is_saas_admin_check', EXISTS (
      SELECT 1 FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_saas_admin = true
    )
  );
$$;

-- Also create an alternative function that checks auth.uid() instead of email
CREATE OR REPLACE FUNCTION public.is_backoffice_admin_by_uid()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.backoffice_users 
    WHERE id = auth.uid()
    AND is_saas_admin = true
  );
$$;

-- Create a temporary policy to test with auth.uid() approach
CREATE POLICY "Backoffice admins can view all clients (temp uid check)" 
  ON public.clients 
  FOR SELECT 
  USING (public.is_backoffice_admin_by_uid());
