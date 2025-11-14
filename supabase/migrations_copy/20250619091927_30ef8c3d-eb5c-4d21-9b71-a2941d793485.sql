
-- Create a SELECT policy for clients table to allow backoffice admins to view all clients
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    DROP POLICY IF EXISTS "Backoffice admins can view all clients" ON public.clients;
    CREATE POLICY "Backoffice admins can view all clients" 
      ON public.clients 
      FOR SELECT 
      USING (public.is_backoffice_admin());
  END IF;
END $$;
