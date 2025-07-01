
-- Enable Row Level Security on facilities table
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view facilities from their client
CREATE POLICY "Users can view facilities from their client"
ON public.facilities
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if facility belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to view all facilities
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert facilities for their client
CREATE POLICY "Users can insert facilities for their client"
ON public.facilities
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if facility is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert facilities for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update facilities from their client
CREATE POLICY "Users can update facilities from their client"
ON public.facilities
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if facility belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any facility
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete facilities from their client
CREATE POLICY "Users can delete facilities from their client"
ON public.facilities
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if facility belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any facility
    public.is_current_user_backoffice_admin() = true
  )
);
