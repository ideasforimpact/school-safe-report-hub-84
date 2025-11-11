-- Update security definer function to include missing fields
-- This function uses dynamic SQL to avoid validation errors during function creation
-- Drop the function first to allow changing return type
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
  employee_type text,
  department text,
  is_super_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
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
    e.employee_type,
    e.department,
    e.is_super_admin
  FROM public.employees e
  WHERE e.email = user_email
  AND e.status = true
  LIMIT 1;
END;
$$;