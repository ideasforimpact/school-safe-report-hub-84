
-- RLS Policies for clients table
-- Enable RLS and create ALL policies from migrations_copy (matching production exactly, including duplicates)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Backoffice admins can view all clients (from 20250619084552)
    DROP POLICY IF EXISTS "Backoffice admins can view all clients" ON public.clients;
    BEGIN
      CREATE POLICY "Backoffice admins can view all clients" ON public.clients
      FOR SELECT USING (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Backoffice admins can create clients (from 20250619084552)
    DROP POLICY IF EXISTS "Backoffice admins can create clients" ON public.clients;
    BEGIN
      CREATE POLICY "Backoffice admins can create clients" ON public.clients
      FOR INSERT WITH CHECK (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Backoffice admins can update clients (from 20250619084552)
    DROP POLICY IF EXISTS "Backoffice admins can update clients" ON public.clients;
    BEGIN
      CREATE POLICY "Backoffice admins can update clients" ON public.clients
      FOR UPDATE USING (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Backoffice admins can delete clients (from 20250619084552)
    DROP POLICY IF EXISTS "Backoffice admins can delete clients" ON public.clients;
BEGIN
      CREATE POLICY "Backoffice admins can delete clients" ON public.clients
      FOR DELETE USING (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Allow service role and backoffice full access to clients (from 20250807050804)
    DROP POLICY IF EXISTS "Allow service role and backoffice full access to clients" ON public.clients;
    BEGIN
      CREATE POLICY "Allow service role and backoffice full access to clients" ON public.clients
      USING (
        auth.role() = 'service_role'::text OR 
        (auth.uid() IS NOT NULL AND is_current_user_backoffice_admin() = true) OR
        is_backoffice_admin() = true
      )
      WITH CHECK (
        auth.role() = 'service_role'::text OR 
        (auth.uid() IS NOT NULL AND is_current_user_backoffice_admin() = true) OR
        is_backoffice_admin() = true
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Users can view their client
      DROP POLICY IF EXISTS "Users can view their client" ON public.clients;
    BEGIN
      CREATE POLICY "Users can view their client" ON public.clients
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 7: Users can insert their client
    DROP POLICY IF EXISTS "Users can insert their client" ON public.clients;
    BEGIN
      CREATE POLICY "Users can insert their client" ON public.clients
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 8: Users can update their client
    DROP POLICY IF EXISTS "Users can update their client" ON public.clients;
    BEGIN
      CREATE POLICY "Users can update their client" ON public.clients
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 9: Users can delete their client
    DROP POLICY IF EXISTS "Users can delete their client" ON public.clients;
    BEGIN
      CREATE POLICY "Users can delete their client" ON public.clients
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


