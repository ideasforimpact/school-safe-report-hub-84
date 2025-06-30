
-- Enable Row Level Security on employee_modules table
ALTER TABLE public.employee_modules ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view employee modules from their own client only
CREATE POLICY "Users can view employee modules from their client only"
ON public.employee_modules
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if employee belongs to the same client as the user
    employee_id IN (
      SELECT e.id 
      FROM public.employees e 
      WHERE e.client_id = public.get_current_user_client_id()
    )
    OR
    -- Allow backoffice users to view all employee modules
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert employee modules for their client only
CREATE POLICY "Users can insert employee modules for their client only"
ON public.employee_modules
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if employee belongs to the same client as the user
    employee_id IN (
      SELECT e.id 
      FROM public.employees e 
      WHERE e.client_id = public.get_current_user_client_id()
    )
    OR
    -- Allow backoffice users to insert modules for any employee
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update employee modules from their client only
CREATE POLICY "Users can update employee modules from their client only"
ON public.employee_modules
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if employee belongs to the same client as the user
    employee_id IN (
      SELECT e.id 
      FROM public.employees e 
      WHERE e.client_id = public.get_current_user_client_id()
    )
    OR
    -- Allow backoffice users to update any employee module
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete employee modules from their client only
CREATE POLICY "Users can delete employee modules from their client only"
ON public.employee_modules
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if employee belongs to the same client as the user
    employee_id IN (
      SELECT e.id 
      FROM public.employees e 
      WHERE e.client_id = public.get_current_user_client_id()
    )
    OR
    -- Allow backoffice users to delete any employee module
    public.is_current_user_backoffice_admin() = true
  )
);
