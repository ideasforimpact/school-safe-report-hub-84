-- Create client_type table (idempotent)
CREATE TABLE IF NOT EXISTS public.client_type (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  key text DEFAULT ''::text NOT NULL,
  name text DEFAULT ''::text NOT NULL
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='client_type_pkey') THEN
    ALTER TABLE public.client_type ADD CONSTRAINT client_type_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Add foreign key constraint from clients.client_type_id to client_type.id
-- This ensures the constraint is created after client_type table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'clients_client_type_id_fkey'
    ) THEN
      ALTER TABLE public.clients
        ADD CONSTRAINT clients_client_type_id_fkey
        FOREIGN KEY (client_type_id) REFERENCES public.client_type(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;


