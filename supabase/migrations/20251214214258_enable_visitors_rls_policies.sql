-- Enable RLS and create policies for visitors table
-- This migration ensures RLS is enabled and all policies are created following the visitor_kyc pattern

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'visitors'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for visitors table';

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.visitors;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.visitors
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
      RAISE NOTICE 'Policy "Allow authentication function access" created for visitors';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Allow authentication function access" already exists for visitors';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Allow authentication function access": %', SQLERRM;
    END;

    -- Policy 2: Users can view visitors from their client
    DROP POLICY IF EXISTS "Users can view visitors from their client" ON public.visitors;
    BEGIN
      CREATE POLICY "Users can view visitors from their client" ON public.visitors
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can view visitors from their client" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can view visitors from their client" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can view visitors from their client": %', SQLERRM;
    END;

    -- Policy 3: Users can insert visitors for their client only
    DROP POLICY IF EXISTS "Users can insert visitors for their client only" ON public.visitors;
    BEGIN
      CREATE POLICY "Users can insert visitors for their client only" ON public.visitors
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can insert visitors for their client only" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can insert visitors for their client only" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can insert visitors for their client only": %', SQLERRM;
    END;

    -- Policy 4: Users can update visitors from their client only
    DROP POLICY IF EXISTS "Users can update visitors from their client only" ON public.visitors;
    BEGIN
      CREATE POLICY "Users can update visitors from their client only" ON public.visitors
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can update visitors from their client only" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can update visitors from their client only" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can update visitors from their client only": %', SQLERRM;
    END;

    -- Policy 5: Users can delete visitors from their client only
    DROP POLICY IF EXISTS "Users can delete visitors from their client only" ON public.visitors;
    BEGIN
      CREATE POLICY "Users can delete visitors from their client only" ON public.visitors
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can delete visitors from their client only" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can delete visitors from their client only" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can delete visitors from their client only": %', SQLERRM;
    END;

  ELSE
    RAISE NOTICE 'visitors table does not exist. Skipping RLS policy creation.';
  END IF;
END $$;

