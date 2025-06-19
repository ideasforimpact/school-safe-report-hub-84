
-- Step 1: Clean up duplicate policies and debug the authentication issue

-- First, drop any duplicate policies that might be conflicting
DROP POLICY IF EXISTS "Backoffice admins can view all clients (temp uid check)" ON public.clients;

-- Create a debug function to see what's happening with authentication
CREATE OR REPLACE FUNCTION public.debug_backoffice_auth()
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'jwt_claims_raw', current_setting('request.jwt.claims', true),
    'jwt_claims_parsed', 
      CASE 
        WHEN current_setting('request.jwt.claims', true) = '' THEN NULL
        ELSE current_setting('request.jwt.claims', true)::json
      END,
    'email_from_jwt', 
      CASE 
        WHEN current_setting('request.jwt.claims', true) = '' THEN NULL
        ELSE current_setting('request.jwt.claims', true)::json->>'email'
      END,
    'backoffice_user_count', (SELECT count(*) FROM public.backoffice_users),
    'matching_backoffice_user', EXISTS (
      SELECT 1 FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ),
    'is_saas_admin_result', public.is_backoffice_admin()
  );
$$;

-- Create an alternative authentication function using auth.uid()
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

-- Test the original policy by making it more explicit and adding some debugging
DROP POLICY IF EXISTS "Backoffice admins can view all clients" ON public.clients;

CREATE POLICY "Backoffice admins can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (
    -- Check if current user is authenticated and is a backoffice admin
    auth.role() = 'authenticated' AND public.is_backoffice_admin()
  );
