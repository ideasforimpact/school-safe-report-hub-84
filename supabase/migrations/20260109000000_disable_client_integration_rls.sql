-- Disable RLS for client_integration table
-- This migration disables Row Level Security and drops all RLS policies for client_integration table
-- This allows the search-students edge function to access client_integration data without RLS restrictions

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_integration'
  ) THEN
    -- Check if RLS is enabled by querying pg_class
    IF EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
      AND c.relname = 'client_integration'
      AND c.relrowsecurity = true
    ) THEN
      -- Drop all existing RLS policies
      DROP POLICY IF EXISTS "Backoffice admins can manage client integrations" ON public.client_integration;
      DROP POLICY IF EXISTS "Backoffice admins can view all client integrations" ON public.client_integration;
      DROP POLICY IF EXISTS "Backoffice admins can insert client integrations" ON public.client_integration;
      DROP POLICY IF EXISTS "Backoffice admins can update client integrations" ON public.client_integration;
      DROP POLICY IF EXISTS "Backoffice admins can delete client integrations" ON public.client_integration;
      
      -- Disable RLS
      ALTER TABLE public.client_integration DISABLE ROW LEVEL SECURITY;
      
      RAISE NOTICE 'RLS disabled for client_integration table';
    ELSE
      RAISE NOTICE 'RLS is already disabled for client_integration table';
    END IF;
  ELSE
    RAISE NOTICE 'client_integration table does not exist, skipping RLS disable';
  END IF;
END $$;

