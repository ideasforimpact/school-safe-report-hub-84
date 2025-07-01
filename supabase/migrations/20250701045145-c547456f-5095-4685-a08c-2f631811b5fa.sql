
-- Enable Row Level Security on incident_report_types table
ALTER TABLE public.incident_report_types ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view incident report types from their client
CREATE POLICY "Users can view incident report types from their client"
ON public.incident_report_types
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if report type belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to view all report types
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert incident report types for their client
CREATE POLICY "Users can insert incident report types for their client"
ON public.incident_report_types
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if report type is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert report types for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update incident report types from their client
CREATE POLICY "Users can update incident report types from their client"
ON public.incident_report_types
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if report type belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any report type
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete incident report types from their client
CREATE POLICY "Users can delete incident report types from their client"
ON public.incident_report_types
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if report type belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any report type
    public.is_current_user_backoffice_admin() = true
  )
);
