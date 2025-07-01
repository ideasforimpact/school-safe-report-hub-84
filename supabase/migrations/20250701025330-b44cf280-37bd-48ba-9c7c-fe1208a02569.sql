
-- Enable Row Level Security on custom_forms table
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view custom forms from their client and public access to active forms
CREATE POLICY "Users can view custom forms from their client and public active forms"
ON public.custom_forms
FOR SELECT
USING (
  -- Allow public access to active forms (for public submissions)
  (is_active = true)
  OR
  -- Allow authenticated users to view forms from their client
  (auth.uid() IS NOT NULL AND client_id = public.get_current_user_client_id())
  OR
  -- Allow backoffice users to view all forms
  (auth.uid() IS NOT NULL AND public.is_current_user_backoffice_admin() = true)
);

-- Policy to allow users to insert custom forms for their client
CREATE POLICY "Users can insert custom forms for their client"
ON public.custom_forms
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if form is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert forms for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update custom forms from their client
CREATE POLICY "Users can update custom forms from their client"
ON public.custom_forms
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if form belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any form
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete custom forms from their client
CREATE POLICY "Users can delete custom forms from their client"
ON public.custom_forms
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if form belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any form
    public.is_current_user_backoffice_admin() = true
  )
);
