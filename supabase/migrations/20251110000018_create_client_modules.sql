-- Create client_modules table (idempotent)
CREATE TABLE IF NOT EXISTS public.client_modules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  module_id uuid,
  access_level jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- PK
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='client_modules_pkey') THEN
    ALTER TABLE public.client_modules ADD CONSTRAINT client_modules_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- FKs when referenced tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='client_modules_client_id_fkey') THEN
    ALTER TABLE public.client_modules
      ADD CONSTRAINT client_modules_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='modules')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='client_modules_module_id_fkey') THEN
    ALTER TABLE public.client_modules
      ADD CONSTRAINT client_modules_module_id_fkey
      FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
  END IF;
END $$;


