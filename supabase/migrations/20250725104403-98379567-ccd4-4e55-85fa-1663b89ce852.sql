-- Create security definer function to bypass RLS during authentication
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
LANGUAGE sql
SECURITY DEFINER
STABLE
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
    e.is_super_admin
  FROM public.employees e
  WHERE e.email = user_email
  AND e.status = true
  LIMIT 1;
$$;