
-- Enable Row Level Security on assessments table
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view assessments from their client or that they're involved with
CREATE POLICY "Users can view assessments from their client or involvement"
ON public.assessments
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if assessment belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow if user created the assessment
    created_by = auth.uid()
    OR
    -- Allow if user is assigned to the assessment
    assigned_to = auth.uid()
    OR
    -- Allow backoffice users to view all assessments
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert assessments for their client
CREATE POLICY "Users can insert assessments for their client"
ON public.assessments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if assessment is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert assessments for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update assessments from their client that they're involved with
CREATE POLICY "Users can update assessments from their client involvement"
ON public.assessments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if assessment belongs to user's client AND (they created it OR are assigned to it)
    (client_id = public.get_current_user_client_id() AND (created_by = auth.uid() OR assigned_to = auth.uid()))
    OR
    -- Allow backoffice users to update any assessment
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete assessments from their client that they created
CREATE POLICY "Users can delete assessments they created in their client"
ON public.assessments
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if assessment belongs to user's client AND they created it
    (client_id = public.get_current_user_client_id() AND created_by = auth.uid())
    OR
    -- Allow backoffice users to delete any assessment
    public.is_current_user_backoffice_admin() = true
  )
);
