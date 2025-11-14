-- Enhanced cleanup: Remove newlines, carriage returns, tabs, and spaces from email addresses
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  -- Check if the employees table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    UPDATE public.employees 
    SET email = TRIM(BOTH E'\n\r\t ' FROM email)
    WHERE email != TRIM(BOTH E'\n\r\t ' FROM email);
  END IF;
END $$;

-- Update the authentication function to handle whitespace/newlines properly
CREATE OR REPLACE FUNCTION public.get_employee_by_email_for_auth(user_email text)
 RETURNS TABLE(id uuid, email text, client_id uuid, user_id uuid, status boolean, first_name text, last_name text, employee_id text, is_super_admin boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  -- It's specifically designed to work during authentication
  -- Enhanced email matching that handles whitespace and newlines
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
  WHERE TRIM(BOTH E'\n\r\t ' FROM e.email) = TRIM(BOTH E'\n\r\t ' FROM user_email)
  AND e.status = true
  LIMIT 1;
END;
$function$;

-- Add trigger to prevent future insertion of emails with trailing whitespace/newlines
CREATE OR REPLACE FUNCTION public.clean_employee_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean email on insert/update
  NEW.email = TRIM(BOTH E'\n\r\t ' FROM NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employees table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employees'
  ) THEN
    DROP TRIGGER IF EXISTS clean_employee_email_trigger ON public.employees;
    CREATE TRIGGER clean_employee_email_trigger
      BEFORE INSERT OR UPDATE ON public.employees
      FOR EACH ROW
      EXECUTE FUNCTION public.clean_employee_email();
  END IF;
END $$;