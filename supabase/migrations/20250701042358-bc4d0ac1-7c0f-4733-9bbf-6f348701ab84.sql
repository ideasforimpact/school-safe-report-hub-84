
-- Enable Row Level Security on incident_priorities table
ALTER TABLE public.incident_priorities ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view incident priorities from their client
CREATE POLICY "Users can view incident priorities from their client"
ON public.incident_priorities
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if priority belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to view all priorities
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert incident priorities for their client
CREATE POLICY "Users can insert incident priorities for their client"
ON public.incident_priorities
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if priority is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert priorities for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update incident priorities from their client
CREATE POLICY "Users can update incident priorities from their client"
ON public.incident_priorities
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if priority belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any priority
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete incident priorities from their client
CREATE POLICY "Users can delete incident priorities from their client"
ON public.incident_priorities
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if priority belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any priority
    public.is_current_user_backoffice_admin() = true
  )
);
