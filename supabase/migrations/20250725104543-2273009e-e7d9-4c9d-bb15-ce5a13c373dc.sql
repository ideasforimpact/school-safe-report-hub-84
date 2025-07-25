-- Update security definer function to include missing fields
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
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
$$;