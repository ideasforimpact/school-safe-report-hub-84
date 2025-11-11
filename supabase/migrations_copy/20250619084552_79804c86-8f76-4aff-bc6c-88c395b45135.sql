
-- Enable Row Level Security on clients and modules tables
-- This migration is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create a security definer function to check if current user is a backoffice admin
-- This function uses dynamic SQL to avoid validation errors during function creation
CREATE OR REPLACE FUNCTION public.is_backoffice_admin()
RETURNS BOOLEAN
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

  -- Check if auth_user_id column exists (it might not exist in older migrations)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users' 
    AND column_name = 'auth_user_id'
  ) THEN
    -- Use new version with auth_user_id
    sql_text := 'SELECT EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE (id = auth.uid() OR auth_user_id = auth.uid())
      AND is_saas_admin = true
    )';
  ELSE
    -- Use old version without auth_user_id
    sql_text := 'SELECT EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE email = current_setting(''request.jwt.claims'', true)::json->>''email''
      AND is_saas_admin = true
    )';
  END IF;

  -- Execute dynamic SQL
  BEGIN
    EXECUTE sql_text INTO result;
    RETURN COALESCE(result, false);
  EXCEPTION
    WHEN OTHERS THEN
      -- If table structure is incomplete or other error, return false
      RETURN false;
  END;
END;
$$;

-- RLS Policies for clients table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    DROP POLICY IF EXISTS "Backoffice admins can view all clients" ON public.clients;
    CREATE POLICY "Backoffice admins can view all clients" 
      ON public.clients 
      FOR SELECT 
      USING (public.is_backoffice_admin());

    DROP POLICY IF EXISTS "Backoffice admins can create clients" ON public.clients;
    CREATE POLICY "Backoffice admins can create clients" 
      ON public.clients 
      FOR INSERT 
      WITH CHECK (public.is_backoffice_admin());

    DROP POLICY IF EXISTS "Backoffice admins can update clients" ON public.clients;
    CREATE POLICY "Backoffice admins can update clients" 
      ON public.clients 
      FOR UPDATE 
      USING (public.is_backoffice_admin());

    DROP POLICY IF EXISTS "Backoffice admins can delete clients" ON public.clients;
    CREATE POLICY "Backoffice admins can delete clients" 
      ON public.clients 
      FOR DELETE 
      USING (public.is_backoffice_admin());
  END IF;
END $$;

-- RLS Policies for modules table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    DROP POLICY IF EXISTS "Backoffice admins can view all modules" ON public.modules;
    CREATE POLICY "Backoffice admins can view all modules" 
      ON public.modules 
      FOR SELECT 
      USING (public.is_backoffice_admin());

    DROP POLICY IF EXISTS "Backoffice admins can create modules" ON public.modules;
    CREATE POLICY "Backoffice admins can create modules" 
      ON public.modules 
      FOR INSERT 
      WITH CHECK (public.is_backoffice_admin());

    DROP POLICY IF EXISTS "Backoffice admins can update modules" ON public.modules;
    CREATE POLICY "Backoffice admins can update modules" 
      ON public.modules 
      FOR UPDATE 
      USING (public.is_backoffice_admin());

    DROP POLICY IF EXISTS "Backoffice admins can delete modules" ON public.modules;
    CREATE POLICY "Backoffice admins can delete modules" 
      ON public.modules 
      FOR DELETE 
      USING (public.is_backoffice_admin());
  END IF;
END $$;
