
-- Drop existing policies to recreate them with better structure
DROP POLICY IF EXISTS "Backoffice admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Backoffice admins can view all clients (temp uid check)" ON public.clients;

-- Recreate the main policy with improved logic
CREATE POLICY "Backoffice admins can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (
    -- Check if current user is authenticated
    auth.role() = 'authenticated' 
    AND 
    (
      -- Check if user is marked as backoffice admin in JWT claims
      (current_setting('request.jwt.claims', true)::json->>'is_backoffice_admin')::boolean = true
      OR
      -- Fallback check using the database function
      public.is_backoffice_admin()
    )
  );

-- Also create policies for other operations that backoffice admins need
CREATE POLICY "Backoffice admins can insert clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND 
    (
      (current_setting('request.jwt.claims', true)::json->>'is_backoffice_admin')::boolean = true
      OR
      public.is_backoffice_admin()
    )
  );

CREATE POLICY "Backoffice admins can update clients" 
  ON public.clients 
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' 
    AND 
    (
      (current_setting('request.jwt.claims', true)::json->>'is_backoffice_admin')::boolean = true
      OR
      public.is_backoffice_admin()
    )
  );

CREATE POLICY "Backoffice admins can delete clients" 
  ON public.clients 
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' 
    AND 
    (
      (current_setting('request.jwt.claims', true)::json->>'is_backoffice_admin')::boolean = true
      OR
      public.is_backoffice_admin()
    )
  );
