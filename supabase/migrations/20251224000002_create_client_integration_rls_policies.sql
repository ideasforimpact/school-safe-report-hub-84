-- RLS Policies for client_integration table
-- Enable RLS and create policies following the same pattern as backoffice_edusafe_resource

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_integration'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.client_integration ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Backoffice admins can manage client integrations
    DROP POLICY IF EXISTS "Backoffice admins can manage client integrations" ON public.client_integration;
    BEGIN
      CREATE POLICY "Backoffice admins can manage client integrations" ON public.client_integration
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Backoffice admins can view all client integrations
    DROP POLICY IF EXISTS "Backoffice admins can view all client integrations" ON public.client_integration;
    BEGIN
      CREATE POLICY "Backoffice admins can view all client integrations" ON public.client_integration
      FOR SELECT USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Backoffice admins can insert client integrations
    DROP POLICY IF EXISTS "Backoffice admins can insert client integrations" ON public.client_integration;
    BEGIN
      CREATE POLICY "Backoffice admins can insert client integrations" ON public.client_integration
      FOR INSERT WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Backoffice admins can update client integrations
    DROP POLICY IF EXISTS "Backoffice admins can update client integrations" ON public.client_integration;
    BEGIN
      CREATE POLICY "Backoffice admins can update client integrations" ON public.client_integration
      FOR UPDATE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Backoffice admins can delete client integrations
    DROP POLICY IF EXISTS "Backoffice admins can delete client integrations" ON public.client_integration;
    BEGIN
      CREATE POLICY "Backoffice admins can delete client integrations" ON public.client_integration
      FOR DELETE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

