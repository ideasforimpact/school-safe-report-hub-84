-- First, let's update the RLS policy for clients table to be more permissive for backoffice users
-- Since the backoffice system uses a different authentication mechanism, we need to allow access

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Backoffice admins can view all clients" ON public.clients;

-- Create a new policy that allows viewing clients for backoffice users
-- This will check if the user is either a regular backoffice admin OR if they're accessing via edge function
CREATE POLICY "Backoffice users can view all clients" ON public.clients
FOR SELECT 
TO authenticated
USING (
  -- Allow if user is a backoffice admin (regular auth)
  is_backoffice_admin() = true 
  OR
  -- Allow if user is authenticated via backoffice system (edge function context)
  is_current_user_backoffice_admin() = true
  OR
  -- Fallback: allow if accessing from service role (edge functions)
  auth.role() = 'service_role'
);

-- Also update the other policies to be consistent
DROP POLICY IF EXISTS "Backoffice admins can create clients" ON public.clients;
DROP POLICY IF EXISTS "Backoffice admins can update clients" ON public.clients;  
DROP POLICY IF EXISTS "Backoffice admins can delete clients" ON public.clients;

CREATE POLICY "Backoffice users can create clients" ON public.clients
FOR INSERT 
TO authenticated
WITH CHECK (
  is_backoffice_admin() = true 
  OR is_current_user_backoffice_admin() = true
  OR auth.role() = 'service_role'
);

CREATE POLICY "Backoffice users can update clients" ON public.clients
FOR UPDATE 
TO authenticated
USING (
  is_backoffice_admin() = true 
  OR is_current_user_backoffice_admin() = true
  OR auth.role() = 'service_role'
);

CREATE POLICY "Backoffice users can delete clients" ON public.clients
FOR DELETE 
TO authenticated
USING (
  is_backoffice_admin() = true 
  OR is_current_user_backoffice_admin() = true
  OR auth.role() = 'service_role'
);