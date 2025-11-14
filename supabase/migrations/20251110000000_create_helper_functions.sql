-- Create helper functions required for RLS policies
-- This migration must run BEFORE policy migrations

-- Function: get_current_user_client_id
-- Returns the client_id for the current authenticated user
-- This function uses dynamic SQL to handle cases where tables don't exist yet
CREATE OR REPLACE FUNCTION public.get_current_user_client_id() 
RETURNS uuid
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result uuid;
BEGIN
  -- Check if employees table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employees'
  ) THEN
    -- First try to get client_id from user_id match
    SELECT client_id INTO result
    FROM public.employees 
    WHERE user_id = auth.uid() 
    AND status = true
    LIMIT 1;
    
    -- If found, return it
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
    
    -- Fallback: try to match by email during authentication
    SELECT client_id INTO result
    FROM public.employees 
    WHERE TRIM(BOTH E'\n\r\t ' FROM email) = TRIM(BOTH E'\n\r\t ' FROM (current_setting('request.jwt.claims', true)::json->>'email'))
    AND status = true
    AND user_id IS NULL  -- Only match unlinked employees
    LIMIT 1;
  END IF;
  
  RETURN result;
END;
$$;

-- Function: is_backoffice_admin
-- Checks if current user is a backoffice admin by email
CREATE OR REPLACE FUNCTION public.is_backoffice_admin() 
RETURNS boolean
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_saas_admin = true
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Function: is_backoffice_admin_by_uid
-- Checks if current user is a backoffice admin by uid
CREATE OR REPLACE FUNCTION public.is_backoffice_admin_by_uid() 
RETURNS boolean
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE id = auth.uid()
      AND is_saas_admin = true
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Function: is_current_user_backoffice_admin
-- Checks if current user is a backoffice admin by auth_user_id
CREATE OR REPLACE FUNCTION public.is_current_user_backoffice_admin() 
RETURNS boolean
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE (auth_user_id = auth.uid())
      AND is_saas_admin = true
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_client_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_backoffice_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_backoffice_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_backoffice_admin_by_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_backoffice_admin_by_uid() TO anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_backoffice_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_backoffice_admin() TO anon;

