-- RLS Policies for visitor_kyc table
-- Enable RLS and create all policies matching employees table pattern

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'visitor_kyc'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.visitor_kyc ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.visitor_kyc;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.visitor_kyc
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view visitor_kyc from their client
    DROP POLICY IF EXISTS "Users can view visitor_kyc from their client" ON public.visitor_kyc;
    BEGIN
      CREATE POLICY "Users can view visitor_kyc from their client" ON public.visitor_kyc
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert visitor_kyc for their client only
    DROP POLICY IF EXISTS "Users can insert visitor_kyc for their client only" ON public.visitor_kyc;
    BEGIN
      CREATE POLICY "Users can insert visitor_kyc for their client only" ON public.visitor_kyc
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update visitor_kyc from their client only
    DROP POLICY IF EXISTS "Users can update visitor_kyc from their client only" ON public.visitor_kyc;
    BEGIN
      CREATE POLICY "Users can update visitor_kyc from their client only" ON public.visitor_kyc
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete visitor_kyc from their client only
    DROP POLICY IF EXISTS "Users can delete visitor_kyc from their client only" ON public.visitor_kyc;
    BEGIN
      CREATE POLICY "Users can delete visitor_kyc from their client only" ON public.visitor_kyc
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

