-- Add foreign key constraint from clients.client_type_id to client_type.id
-- Run this directly in Supabase SQL Editor to fix the PostgREST relationship error
-- This constraint should exist but may be missing due to migration order

DO $$
BEGIN
  -- Check if both tables exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_type'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'clients_client_type_id_fkey'
    ) THEN
      ALTER TABLE public.clients
        ADD CONSTRAINT clients_client_type_id_fkey
        FOREIGN KEY (client_type_id) REFERENCES public.client_type(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Successfully added clients_client_type_id_fkey constraint';
    ELSE
      RAISE NOTICE 'Constraint clients_client_type_id_fkey already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Required tables (clients or client_type) do not exist';
  END IF;
END $$;



