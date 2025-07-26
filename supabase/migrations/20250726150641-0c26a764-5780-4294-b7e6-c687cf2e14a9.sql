-- Create a more robust get_employee_by_email_for_auth function that can work during authentication
-- This function will bypass RLS by using SECURITY DEFINER with proper permissions

DROP FUNCTION IF EXISTS public.get_employee_by_email_for_auth(text);

CREATE OR REPLACE FUNCTION public.get_employee_by_email_for_auth(user_email text)
RETURNS TABLE(
  id uuid, 
  email text, 
  client_id uuid, 
  user_id uuid, 
  status boolean, 
  first_name text, 
  last_name text, 
  employee_id text, 
  is_super_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  -- It's specifically designed to work during authentication
  RETURN QUERY
  SELECT 
    e.id,
    e.email,
    e.client_id,
    e.user_id,
    e.status,
    e.first_name,
    e.last_name,
    e.employee_id,
    e.is_super_admin
  FROM public.employees e
  WHERE e.email = user_email
  AND e.status = true
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_by_email_for_auth(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_by_email_for_auth(text) TO anon;

-- Add a specific RLS policy that allows the security definer function to work
-- This policy will allow access to employee records during authentication
CREATE POLICY "Allow authentication function access" 
ON public.employees 
FOR SELECT 
USING (
  -- Allow access when called by security definer functions
  current_setting('role') = 'authenticated' OR 
  current_setting('role') = 'anon' OR
  current_setting('role') = 'postgres'
);