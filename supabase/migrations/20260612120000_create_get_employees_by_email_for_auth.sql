-- New plural variant of get_employee_by_email_for_auth that returns ALL active
-- employee rows for the given email along with their client name + logo.
-- Used by the multi-client picker on the Google OAuth / Azure AD post-login flow.
-- The original singular function is left untouched for safety/backward-compat.

CREATE OR REPLACE FUNCTION public.get_employees_by_email_for_auth(user_email text)
 RETURNS TABLE(
   id uuid,
   email text,
   client_id uuid,
   user_id uuid,
   status boolean,
   first_name text,
   last_name text,
   employee_id text,
   is_super_admin boolean,
   department uuid,
   employee_type uuid,
   client_name text,
   client_logo text,
   client_active boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
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
    e.employee_type,
    c.name AS client_name,
    COALESCE(c.logo, c.client_logo) AS client_logo,
    c.active AS client_active
  FROM public.employees e
  LEFT JOIN public.clients c ON c.id = e.client_id
  WHERE TRIM(BOTH E'\n\r\t ' FROM e.email) = TRIM(BOTH E'\n\r\t ' FROM user_email)
    AND e.status = true
    AND (c.active IS NULL OR c.active = true)
  ORDER BY c.name NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_employees_by_email_for_auth(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employees_by_email_for_auth(text) TO anon;
