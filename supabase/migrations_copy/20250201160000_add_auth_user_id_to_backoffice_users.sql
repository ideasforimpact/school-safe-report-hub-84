-- Add auth_user_id column to backoffice_users table to reference Supabase auth users
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the backoffice_users table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'backoffice_users' 
      AND column_name = 'auth_user_id'
    ) THEN
ALTER TABLE public.backoffice_users 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance on auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_backoffice_users_auth_user_id 
ON public.backoffice_users(auth_user_id);

-- Add comment to document the purpose of this column
COMMENT ON COLUMN public.backoffice_users.auth_user_id IS 'Reference to Supabase auth.users table for linking backoffice users to their auth accounts';
    END IF;
  END IF;
END $$;

-- Update the is_current_user_backoffice_admin function to also check auth_user_id
-- This function can be created/replaced even if the table doesn't exist yet
-- Uses dynamic SQL to avoid validation errors during function creation
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

  -- Check if auth_user_id column exists (it might not exist in older migrations)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users' 
    AND column_name = 'auth_user_id'
  ) THEN
    -- Use old version without auth_user_id
    sql_text := 'SELECT EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE id = auth.uid()
      AND is_saas_admin = true
    )';
  ELSE
    -- Use new version with auth_user_id
    sql_text := 'SELECT EXISTS (
    SELECT 1 
    FROM public.backoffice_users 
    WHERE (id = auth.uid() OR auth_user_id = auth.uid())
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












