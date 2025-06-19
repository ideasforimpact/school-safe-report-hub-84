
-- Drop the existing restrictive SELECT policy for modules
DROP POLICY "Backoffice admins can view all modules" ON public.modules;

-- Create a new SELECT policy that allows both authenticated users and backoffice admins
CREATE POLICY "Authenticated users and backoffice admins can view modules" 
  ON public.modules 
  FOR SELECT 
  USING (auth.role() = 'authenticated' OR public.is_backoffice_admin());
