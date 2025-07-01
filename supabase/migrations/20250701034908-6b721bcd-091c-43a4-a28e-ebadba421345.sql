
-- Enable Row Level Security on incident_audit_log table
ALTER TABLE public.incident_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view incident audit logs from their client
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

-- Policy to allow users to insert incident audit logs for their client
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

-- Policy to allow users to update incident audit logs from their client
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

-- Policy to allow users to delete incident audit logs from their client
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
