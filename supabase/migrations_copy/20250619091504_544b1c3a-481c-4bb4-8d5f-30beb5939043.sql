
-- Drop the existing restrictive SELECT policy for modules
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    DROP POLICY IF EXISTS "Backoffice admins can view all modules" ON public.modules;

    -- Create a new SELECT policy that allows both authenticated users and backoffice admins
    DROP POLICY IF EXISTS "Authenticated users and backoffice admins can view modules" ON public.modules;
    CREATE POLICY "Authenticated users and backoffice admins can view modules" 
      ON public.modules 
      FOR SELECT 
      USING (auth.role() = 'authenticated' OR public.is_backoffice_admin());
  END IF;
END $$;
