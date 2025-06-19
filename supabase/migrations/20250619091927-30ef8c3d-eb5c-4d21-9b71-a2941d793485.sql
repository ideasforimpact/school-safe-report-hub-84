
-- Create a SELECT policy for clients table to allow backoffice admins to view all clients
CREATE POLICY "Backoffice admins can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (public.is_backoffice_admin());
