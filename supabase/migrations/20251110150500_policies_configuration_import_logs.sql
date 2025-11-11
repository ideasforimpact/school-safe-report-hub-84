-- RLS Policies for configuration_import_logs table
-- Enable RLS and create policies for configuration_import_logs table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'configuration_import_logs'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.configuration_import_logs ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view configuration import logs from their client
    DROP POLICY IF EXISTS "Users can view configuration import logs from their client" ON public.configuration_import_logs;
    BEGIN
      CREATE POLICY "Users can view configuration import logs from their client" ON public.configuration_import_logs
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert configuration import logs for their client
    DROP POLICY IF EXISTS "Users can insert configuration import logs for their client" ON public.configuration_import_logs;
    BEGIN
      CREATE POLICY "Users can insert configuration import logs for their client" ON public.configuration_import_logs
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage all configuration import logs
    DROP POLICY IF EXISTS "Backoffice admins can manage all configuration import logs" ON public.configuration_import_logs;
    BEGIN
      CREATE POLICY "Backoffice admins can manage all configuration import logs" ON public.configuration_import_logs
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

