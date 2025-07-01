
-- Drop existing RLS policies on incident_subcategories table
DROP POLICY IF EXISTS "Users can create subcategories for their client" ON public.incident_subcategories;
DROP POLICY IF EXISTS "Users can update subcategories for their client" ON public.incident_subcategories;  
DROP POLICY IF EXISTS "Users can view subcategories for their client" ON public.incident_subcategories;

-- Create new comprehensive RLS policies for incident_subcategories table

-- Policy to allow users to view incident subcategories from their client
CREATE POLICY "Users can view incident subcategories from their client"
ON public.incident_subcategories
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if subcategory belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to view all subcategories
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to insert incident subcategories for their client
CREATE POLICY "Users can insert incident subcategories for their client"
ON public.incident_subcategories
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if subcategory is being created for the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to insert subcategories for any client
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to update incident subcategories from their client
CREATE POLICY "Users can update incident subcategories from their client"
ON public.incident_subcategories
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if subcategory belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to update any subcategory
    public.is_current_user_backoffice_admin() = true
  )
);

-- Policy to allow users to delete incident subcategories from their client
CREATE POLICY "Users can delete incident subcategories from their client"
ON public.incident_subcategories
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if subcategory belongs to the user's client
    client_id = public.get_current_user_client_id()
    OR
    -- Allow backoffice users to delete any subcategory
    public.is_current_user_backoffice_admin() = true
  )
);
