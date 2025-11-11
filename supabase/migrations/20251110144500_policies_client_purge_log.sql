-- RLS Policies for client_purge_log table
-- Enable RLS and create policies for client_purge_log table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_purge_log'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.client_purge_log ENABLE ROW LEVEL SECURITY;

    -- Policy: Backoffice admins can view all client purge logs
    DROP POLICY IF EXISTS "Backoffice admins can view all client purge logs" ON public.client_purge_log;
    BEGIN
      CREATE POLICY "Backoffice admins can view all client purge logs" ON public.client_purge_log
      FOR SELECT USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can insert client purge logs
    DROP POLICY IF EXISTS "Backoffice admins can insert client purge logs" ON public.client_purge_log;
    BEGIN
      CREATE POLICY "Backoffice admins can insert client purge logs" ON public.client_purge_log
      FOR INSERT WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can update client purge logs
    DROP POLICY IF EXISTS "Backoffice admins can update client purge logs" ON public.client_purge_log;
    BEGIN
      CREATE POLICY "Backoffice admins can update client purge logs" ON public.client_purge_log
      FOR UPDATE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can delete client purge logs
    DROP POLICY IF EXISTS "Backoffice admins can delete client purge logs" ON public.client_purge_log;
    BEGIN
      CREATE POLICY "Backoffice admins can delete client purge logs" ON public.client_purge_log
      FOR DELETE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

