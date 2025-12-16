-- Enable RLS and create policies for trusted_vehicle table
-- This migration ensures RLS is enabled and all policies are created following the visitors table pattern

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'trusted_vehicle'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.trusted_vehicle ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for trusted_vehicle table';

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.trusted_vehicle;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.trusted_vehicle
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
      RAISE NOTICE 'Policy "Allow authentication function access" created for trusted_vehicle';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Allow authentication function access" already exists for trusted_vehicle';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Allow authentication function access": %', SQLERRM;
    END;

    -- Policy 2: Users can view trusted_vehicle from their client
    DROP POLICY IF EXISTS "Users can view trusted_vehicle from their client" ON public.trusted_vehicle;
    BEGIN
      CREATE POLICY "Users can view trusted_vehicle from their client" ON public.trusted_vehicle
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can view trusted_vehicle from their client" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can view trusted_vehicle from their client" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can view trusted_vehicle from their client": %', SQLERRM;
    END;

    -- Policy 3: Users can insert trusted_vehicle for their client only
    DROP POLICY IF EXISTS "Users can insert trusted_vehicle for their client only" ON public.trusted_vehicle;
    BEGIN
      CREATE POLICY "Users can insert trusted_vehicle for their client only" ON public.trusted_vehicle
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can insert trusted_vehicle for their client only" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can insert trusted_vehicle for their client only" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can insert trusted_vehicle for their client only": %', SQLERRM;
    END;

    -- Policy 4: Users can update trusted_vehicle from their client only
    DROP POLICY IF EXISTS "Users can update trusted_vehicle from their client only" ON public.trusted_vehicle;
    BEGIN
      CREATE POLICY "Users can update trusted_vehicle from their client only" ON public.trusted_vehicle
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can update trusted_vehicle from their client only" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can update trusted_vehicle from their client only" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can update trusted_vehicle from their client only": %', SQLERRM;
    END;

    -- Policy 5: Users can delete trusted_vehicle from their client only
    DROP POLICY IF EXISTS "Users can delete trusted_vehicle from their client only" ON public.trusted_vehicle;
    BEGIN
      CREATE POLICY "Users can delete trusted_vehicle from their client only" ON public.trusted_vehicle
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
      RAISE NOTICE 'Policy "Users can delete trusted_vehicle from their client only" created';
    EXCEPTION WHEN duplicate_object THEN 
      RAISE NOTICE 'Policy "Users can delete trusted_vehicle from their client only" already exists';
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating policy "Users can delete trusted_vehicle from their client only": %', SQLERRM;
    END;

  ELSE
    RAISE NOTICE 'trusted_vehicle table does not exist. Skipping RLS policy creation.';
  END IF;
END $$;

