-- Create clients table (idempotent)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text,
  contact_person text,
  phone text,
  creation_date timestamptz DEFAULT now() NOT NULL,
  active boolean DEFAULT true NOT NULL,
  logo text,
  institution_type text,
  allowed_domains text,
  auth_providers text,
  super_admin_allowed_domain text,
  client_type_id uuid,
  client_logo text
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_pkey' AND conrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_client_type_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='client_type'
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_client_type_id_fkey
      FOREIGN KEY (client_type_id) REFERENCES public.client_type(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Comments (optional, idempotent)
DO $$
BEGIN
  BEGIN
    COMMENT ON COLUMN public.clients.client_logo IS 'URL or path to the client logo image';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;


