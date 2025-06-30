
-- Enable Row Level Security on assessment_templates table
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view assessment templates from their client and global templates
CREATE POLICY "Users can view assessment templates from their client and global templates"
ON public.assessment_templates
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if template belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow global templates (client_id is NULL)
    client_id IS NULL
    OR
    -- Allow backoffice users to view all templates
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert assessment templates for their client
CREATE POLICY "Users can insert assessment templates for their client"
ON public.assessment_templates
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if template is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert templates for any client or as global
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update assessment templates from their client
CREATE POLICY "Users can update assessment templates from their client"
ON public.assessment_templates
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if template belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any template
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete assessment templates from their client
CREATE POLICY "Users can delete assessment templates from their client"
ON public.assessment_templates
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if template belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any template
    public.is_current_user_backoffice_admin() = true
  )
);
