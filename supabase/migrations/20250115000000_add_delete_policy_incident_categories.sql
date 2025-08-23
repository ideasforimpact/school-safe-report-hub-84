-- Add DELETE RLS policy for incident_categories table
-- This policy allows users to delete categories that belong to their client

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Users can delete incident categories from their client" ON public.incident_categories;

-- Create DELETE policy for incident_categories table
CREATE POLICY "Users can delete incident categories from their client"
ON public.incident_categories
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow if category belongs to the user's client
    client_id IN (
      SELECT employees.client_id
      FROM employees
      WHERE employees.user_id = auth.uid()
    )
    OR
    -- Allow backoffice users to delete any category
    public.is_current_user_backoffice_admin() = true
  )
); 