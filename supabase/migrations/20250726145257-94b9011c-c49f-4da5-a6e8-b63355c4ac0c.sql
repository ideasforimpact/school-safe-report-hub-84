-- Fix RLS policy for employees table to allow users to view their own record during authentication
-- This resolves the circular dependency issue during SSO login

-- Drop the existing policy that causes circular dependency
DROP POLICY IF EXISTS "Users can view employees from their client only" ON public.employees;

-- Create new policies that allow users to view their own employee record and employees from their client
CREATE POLICY "Users can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view employees from their client" 
ON public.employees 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    client_id = get_current_user_client_id() 
    OR is_current_user_backoffice_admin() = true
  )
);

-- Update the get_current_user_client_id function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id 
  FROM public.employees 
  WHERE user_id = auth.uid() 
  AND status = true
  LIMIT 1;
$$;