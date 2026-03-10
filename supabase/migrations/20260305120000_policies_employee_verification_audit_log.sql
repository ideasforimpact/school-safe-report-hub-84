-- RLS Policies for employee_verification_audit_log table
-- Enable RLS and create policies for employee_verification_audit_log table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employee_verification_audit_log'
  ) THEN
    -- Keep RLS enabled and add explicit policies for client-scoped access.
    ALTER TABLE public.employee_verification_audit_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view employee verification audit logs from their client" ON public.employee_verification_audit_log;
    BEGIN
      CREATE POLICY "Users can view employee verification audit logs from their client" ON public.employee_verification_audit_log
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          employee_id IN (
            SELECT e.id
            FROM public.employees e
            WHERE e.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert employee verification audit logs for their client" ON public.employee_verification_audit_log;
    BEGIN
      CREATE POLICY "Users can insert employee verification audit logs for their client" ON public.employee_verification_audit_log
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          employee_id IN (
            SELECT e.id
            FROM public.employees e
            WHERE e.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update employee verification audit logs from their client" ON public.employee_verification_audit_log;
    BEGIN
      CREATE POLICY "Users can update employee verification audit logs from their client" ON public.employee_verification_audit_log
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          employee_id IN (
            SELECT e.id
            FROM public.employees e
            WHERE e.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete employee verification audit logs from their client" ON public.employee_verification_audit_log;
    BEGIN
      CREATE POLICY "Users can delete employee verification audit logs from their client" ON public.employee_verification_audit_log
      FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND (
          employee_id IN (
            SELECT e.id
            FROM public.employees e
            WHERE e.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
