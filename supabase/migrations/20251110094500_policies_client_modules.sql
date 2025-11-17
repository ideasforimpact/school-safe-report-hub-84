
-- RLS Policies for client_modules table
-- Enable RLS and create all policies matching production

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_modules'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view client modules from their client
    DROP POLICY IF EXISTS "Users can view client modules from their client" ON public.client_modules;
    BEGIN
      CREATE POLICY "Users can view client modules from their client" ON public.client_modules
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert client modules for their client
    DROP POLICY IF EXISTS "Users can insert client modules for their client" ON public.client_modules;
    BEGIN
      CREATE POLICY "Users can insert client modules for their client" ON public.client_modules
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update client modules from their client
    DROP POLICY IF EXISTS "Users can update client modules from their client" ON public.client_modules;
    BEGIN
      CREATE POLICY "Users can update client modules from their client" ON public.client_modules
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete client modules from their client
    DROP POLICY IF EXISTS "Users can delete client modules from their client" ON public.client_modules;
    BEGIN
      CREATE POLICY "Users can delete client modules from their client" ON public.client_modules
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


