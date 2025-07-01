
-- Enable Row Level Security on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view students from their client
CREATE POLICY "Users can view students from their client"
ON public.students
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if student belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to view all students
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert students for their client
CREATE POLICY "Users can insert students for their client"
ON public.students
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if student is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert students for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update students from their client
CREATE POLICY "Users can update students from their client"
ON public.students
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if student belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any student
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete students from their client
CREATE POLICY "Users can delete students from their client"
ON public.students
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if student belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any student
    public.is_current_user_backoffice_admin() = true
  )
);
