
-- Enable Row Level Security on incident_audit_log table
-- This migration is conditional to avoid errors if the table doesn't exist yet
-- Also checks if client_id column exists before creating policies that reference it
DO $$
DECLARE
  has_client_id boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incident_audit_log') THEN
    ALTER TABLE public.incident_audit_log ENABLE ROW LEVEL SECURITY;

    -- Check if client_id column exists
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'incident_audit_log' 
      AND column_name = 'client_id'
    ) INTO has_client_id;

    -- Policy to allow users to view incident audit logs from their client
    DROP POLICY IF EXISTS "Users can view incident audit logs from their client" ON public.incident_audit_log;
    IF has_client_id THEN
      CREATE POLICY "Users can view incident audit logs from their client"
      ON public.incident_audit_log
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND
        (
          -- Allow if audit log belongs to the user's client
          client_id = public.get_current_user_client_id()
          OR
          -- Allow backoffice users to view all audit logs
          public.is_current_user_backoffice_admin() = true
        )
      );
    ELSE
      -- If client_id doesn't exist, allow all authenticated users to view
      CREATE POLICY "Users can view incident audit logs from their client"
      ON public.incident_audit_log
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND
        public.is_current_user_backoffice_admin() = true
      );
    END IF;

    -- Policy to allow users to insert incident audit logs for their client
    DROP POLICY IF EXISTS "Users can insert incident audit logs for their client" ON public.incident_audit_log;
    IF has_client_id THEN
      CREATE POLICY "Users can insert incident audit logs for their client"
      ON public.incident_audit_log
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND
        (
          -- Allow if audit log is being created for the user's client
          client_id = public.get_current_user_client_id()
          OR
          -- Allow backoffice users to insert audit logs for any client
          public.is_current_user_backoffice_admin() = true
        )
      );
    ELSE
      -- If client_id doesn't exist, allow backoffice users only
      CREATE POLICY "Users can insert incident audit logs for their client"
      ON public.incident_audit_log
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND
        public.is_current_user_backoffice_admin() = true
      );
    END IF;

    -- Policy to allow users to update incident audit logs from their client
    DROP POLICY IF EXISTS "Users can update incident audit logs from their client" ON public.incident_audit_log;
    IF has_client_id THEN
      CREATE POLICY "Users can update incident audit logs from their client"
      ON public.incident_audit_log
      FOR UPDATE
      USING (
        auth.uid() IS NOT NULL AND
        (
          -- Allow if audit log belongs to the user's client
          client_id = public.get_current_user_client_id()
          OR
          -- Allow backoffice users to update any audit log
          public.is_current_user_backoffice_admin() = true
        )
      );
    ELSE
      -- If client_id doesn't exist, allow backoffice users only
      CREATE POLICY "Users can update incident audit logs from their client"
      ON public.incident_audit_log
      FOR UPDATE
      USING (
        auth.uid() IS NOT NULL AND
        public.is_current_user_backoffice_admin() = true
      );
    END IF;

    -- Policy to allow users to delete incident audit logs from their client
    DROP POLICY IF EXISTS "Users can delete incident audit logs from their client" ON public.incident_audit_log;
    IF has_client_id THEN
      CREATE POLICY "Users can delete incident audit logs from their client"
      ON public.incident_audit_log
      FOR DELETE
      USING (
        auth.uid() IS NOT NULL AND
        (
          -- Allow if audit log belongs to the user's client
          client_id = public.get_current_user_client_id()
          OR
          -- Allow backoffice users to delete any audit log
          public.is_current_user_backoffice_admin() = true
        )
      );
    ELSE
      -- If client_id doesn't exist, allow backoffice users only
      CREATE POLICY "Users can delete incident audit logs from their client"
      ON public.incident_audit_log
      FOR DELETE
      USING (
        auth.uid() IS NOT NULL AND
        public.is_current_user_backoffice_admin() = true
      );
    END IF;
  END IF;
END $$;
