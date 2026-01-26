-- Update get_employee_by_email_for_auth function to return department and employee_type as uuid instead of text
-- This migration updates the function to match the schema changes where department and employee_type
-- are now UUID foreign keys instead of text columns

-- Drop the existing function first (we need to drop it because we're changing the return type)
DROP FUNCTION IF EXISTS public.get_employee_by_email_for_auth(text);

-- Recreate the function with the updated return types
CREATE FUNCTION public.get_employee_by_email_for_auth(user_email text)
 RETURNS TABLE(id uuid, email text, client_id uuid, user_id uuid, status boolean, first_name text, last_name text, employee_id text, is_super_admin boolean, department uuid, employee_type uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  -- It's specifically designed to work during authentication
  -- Enhanced email matching that handles whitespace and newlines
  -- Check if employees table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    RETURN;
  END IF;

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
    e.is_super_admin,
    e.department,
    e.employee_type
  FROM public.employees e
  WHERE TRIM(BOTH E'\n\r\t ' FROM e.email) = TRIM(BOTH E'\n\r\t ' FROM user_email)
  AND e.status = true
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_by_email_for_auth(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_by_email_for_auth(text) TO anon;

