-- Fix RLS policy for employees table to allow users to view their own record during authentication
-- This resolves the circular dependency issue during SSO login
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    -- Drop the existing policy that causes circular dependency
    DROP POLICY IF EXISTS "Users can view employees from their client only" ON public.employees;

    -- Create new policies that allow users to view their own employee record and employees from their client
    DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
    CREATE POLICY "Users can view their own employee record" 
    ON public.employees 
    FOR SELECT 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view employees from their client" ON public.employees;
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
  END IF;
END $$;

-- Update the get_current_user_client_id function to be more robust
-- This function uses dynamic SQL to avoid validation errors during function creation
CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result uuid;
  sql_text text;
BEGIN
  -- Check if the employees table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    RETURN NULL;
  END IF;

  sql_text := 'SELECT client_id 
    FROM public.employees 
    WHERE user_id = auth.uid() 
    AND status = true
    LIMIT 1';

  BEGIN
    EXECUTE sql_text INTO result;
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$;