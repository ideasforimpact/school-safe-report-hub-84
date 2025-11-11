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


