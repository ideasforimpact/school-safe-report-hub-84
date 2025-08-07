-- Fix clients table RLS policies to support backoffice authentication
-- The issue is that backoffice users don't have Supabase auth sessions, so we need to update the RLS

-- Drop existing policies that rely on auth.uid() which doesn't work for backoffice users
DROP POLICY IF EXISTS "Backoffice users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Backoffice users can create clients" ON public.clients;  
DROP POLICY IF EXISTS "Backoffice users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Backoffice users can delete clients" ON public.clients;

-- Create new policies that allow service role access (which backoffice uses) and also authenticated users
CREATE POLICY "Allow service role and backoffice full access to clients" 
ON public.clients 
FOR ALL
USING (
  -- Service role has full access (used by backoffice)
  auth.role() = 'service_role'::text OR 
  -- Authenticated users with backoffice admin function
  (auth.uid() IS NOT NULL AND is_current_user_backoffice_admin() = true) OR
  -- Legacy backoffice admin function  
  is_backoffice_admin() = true
)
WITH CHECK (
  -- Service role has full access (used by backoffice)
  auth.role() = 'service_role'::text OR 
  -- Authenticated users with backoffice admin function
  (auth.uid() IS NOT NULL AND is_current_user_backoffice_admin() = true) OR
  -- Legacy backoffice admin function  
  is_backoffice_admin() = true
);

-- Also ensure backoffice_users table policies work correctly
-- Add a policy for service role access to backoffice_users
CREATE POLICY "Service role can access backoffice users" 
ON public.backoffice_users 
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);