
-- Drop existing problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view employees from their client only" ON public.employees;
DROP POLICY IF EXISTS "Backoffice users can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees for their client only" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees from their client only" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees from their client only" ON public.employees;

-- Create a security definer function to safely get current user's client_id
CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT client_id 
  FROM public.employees 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Create a security definer function to check if user is backoffice admin
CREATE OR REPLACE FUNCTION public.is_current_user_backoffice_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.backoffice_users 
    WHERE id = auth.uid() 
    AND is_saas_admin = true
  );
$$;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can view employees from their client only"
ON public.employees
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    client_id = public.get_current_user_client_id()
    OR
    public.is_current_user_backoffice_admin() = true
  )
);

CREATE POLICY "Users can insert employees for their client only"
ON public.employees
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    client_id = public.get_current_user_client_id()
    OR
    public.is_current_user_backoffice_admin() = true
  )
);

CREATE POLICY "Users can update employees from their client only"
ON public.employees
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    client_id = public.get_current_user_client_id()
    OR
    public.is_current_user_backoffice_admin() = true
  )
);

CREATE POLICY "Users can delete employees from their client only"
ON public.employees
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    client_id = public.get_current_user_client_id()
    OR
    public.is_current_user_backoffice_admin() = true
  )
);
