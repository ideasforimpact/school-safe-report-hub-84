-- RLS Policies for assessment_audit_log table
-- Enable RLS and create policies for assessment_audit_log table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assessment_audit_log'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.assessment_audit_log ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view assessment audit logs from their client
    DROP POLICY IF EXISTS "Users can view assessment audit logs from their client" ON public.assessment_audit_log;
    BEGIN
      CREATE POLICY "Users can view assessment audit logs from their client" ON public.assessment_audit_log
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert assessment audit logs for their client
    DROP POLICY IF EXISTS "Users can insert assessment audit logs for their client" ON public.assessment_audit_log;
    BEGIN
      CREATE POLICY "Users can insert assessment audit logs for their client" ON public.assessment_audit_log
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update assessment audit logs from their client
    DROP POLICY IF EXISTS "Users can update assessment audit logs from their client" ON public.assessment_audit_log;
    BEGIN
      CREATE POLICY "Users can update assessment audit logs from their client" ON public.assessment_audit_log
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete assessment audit logs from their client
    DROP POLICY IF EXISTS "Users can delete assessment audit logs from their client" ON public.assessment_audit_log;
    BEGIN
      CREATE POLICY "Users can delete assessment audit logs from their client" ON public.assessment_audit_log
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

