-- Update the authentication function to include department and employee_type fields
-- This function uses dynamic SQL to avoid validation errors during function creation
-- Drop the function first to allow changing return type
DROP FUNCTION IF EXISTS public.get_employee_by_email_for_auth(text);

CREATE OR REPLACE FUNCTION public.get_employee_by_email_for_auth(user_email text)
 RETURNS TABLE(id uuid, email text, client_id uuid, user_id uuid, status boolean, first_name text, last_name text, employee_id text, is_super_admin boolean, department text, employee_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;