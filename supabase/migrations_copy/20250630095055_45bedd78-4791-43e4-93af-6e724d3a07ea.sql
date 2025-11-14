
-- Drop existing problematic RLS policies that cause infinite recursion
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    DROP POLICY IF EXISTS "Users can view employees from their client only" ON public.employees;
    DROP POLICY IF EXISTS "Backoffice users can view all employees" ON public.employees;
    DROP POLICY IF EXISTS "Users can insert employees for their client only" ON public.employees;
    DROP POLICY IF EXISTS "Users can update employees from their client only" ON public.employees;
    DROP POLICY IF EXISTS "Users can delete employees from their client only" ON public.employees;
  END IF;
END $$;

-- Create a security definer function to safely get current user's client_id
-- This function uses dynamic SQL to avoid validation errors during function creation
CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Create a security definer function to check if user is backoffice admin
-- This function uses dynamic SQL to avoid validation errors during function creation
CREATE OR REPLACE FUNCTION public.is_current_user_backoffice_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result boolean;
  sql_text text;
BEGIN
  -- Check if the backoffice_users table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users'
  ) THEN
    RETURN false;
  END IF;

  -- Check if auth_user_id column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users' 
    AND column_name = 'auth_user_id'
  ) THEN
    sql_text := 'SELECT EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE (id = auth.uid() OR auth_user_id = auth.uid())
      AND is_saas_admin = true
    )';
  ELSE
    sql_text := 'SELECT EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE id = auth.uid() 
      AND is_saas_admin = true
    )';
  END IF;

  BEGIN
    EXECUTE sql_text INTO result;
    RETURN COALESCE(result, false);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN false;
  END;
END;
$$;

-- Create new RLS policies using security definer functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    CREATE POLICY "Users can view employees from their client only"
    ON public.employees
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL AND
      (
        client_id = public.get_current_user_client_id()
        OR
        public.is_current_user_backoffice_admin() = true
      )
    );

    CREATE POLICY "Users can insert employees for their client only"
    ON public.employees
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (
        client_id = public.get_current_user_client_id()
        OR
        public.is_current_user_backoffice_admin() = true
      )
    );

    CREATE POLICY "Users can update employees from their client only"
    ON public.employees
    FOR UPDATE
    USING (
      auth.uid() IS NOT NULL AND
      (
        client_id = public.get_current_user_client_id()
        OR
        public.is_current_user_backoffice_admin() = true
      )
    );

    CREATE POLICY "Users can delete employees from their client only"
    ON public.employees
    FOR DELETE
    USING (
      auth.uid() IS NOT NULL AND
      (
        client_id = public.get_current_user_client_id()
        OR
        public.is_current_user_backoffice_admin() = true
      )
    );
  END IF;
END $$;
