-- RLS Policies for student_wellbeing_audit_log table
-- Mirrors policies for incident_audit_log

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_wellbeing_audit_log'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.student_wellbeing_audit_log ENABLE ROW LEVEL SECURITY;

    -- SELECT policy
    DROP POLICY IF EXISTS "Users can view student wellbeing audit logs from their client" 
      ON public.student_wellbeing_audit_log;
    BEGIN
      CREATE POLICY "Users can view student wellbeing audit logs from their client"
        ON public.student_wellbeing_audit_log
        FOR SELECT USING (
          auth.uid() IS NOT NULL 
          AND (
            client_id = public.get_current_user_client_id() 
            OR public.is_current_user_backoffice_admin() = true
          )
        );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- INSERT policy
    DROP POLICY IF EXISTS "Users can insert student wellbeing audit logs for their client" 
      ON public.student_wellbeing_audit_log;
    BEGIN
      CREATE POLICY "Users can insert student wellbeing audit logs for their client"
        ON public.student_wellbeing_audit_log
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL 
          AND (
            client_id = public.get_current_user_client_id() 
            OR public.is_current_user_backoffice_admin() = true
          )
        );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- UPDATE policy
    DROP POLICY IF EXISTS "Users can update student wellbeing audit logs from their client" 
      ON public.student_wellbeing_audit_log;
    BEGIN
      CREATE POLICY "Users can update student wellbeing audit logs from their client"
        ON public.student_wellbeing_audit_log
        FOR UPDATE USING (
          auth.uid() IS NOT NULL 
          AND (
            client_id = public.get_current_user_client_id() 
            OR public.is_current_user_backoffice_admin() = true
          )
        );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- DELETE policy
    DROP POLICY IF EXISTS "Users can delete student wellbeing audit logs from their client" 
      ON public.student_wellbeing_audit_log;
    BEGIN
      CREATE POLICY "Users can delete student wellbeing audit logs from their client"
        ON public.student_wellbeing_audit_log
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

