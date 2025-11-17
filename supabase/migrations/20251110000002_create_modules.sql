-- Create modules table
-- This migration creates the modules table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.modules (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      level text NOT NULL,
      icon text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      "order" integer,
      url text,
      active boolean DEFAULT true NOT NULL,
      CONSTRAINT modules_pkey PRIMARY KEY (id)
    );

    -- Add comment
    COMMENT ON TABLE public.modules IS 'Stores module definitions';
  END IF;
END $$;

-- Add foreign key constraints from tables that depend on modules
-- This ensures FKs are created after modules table exists
DO $$
BEGIN
  -- client_modules.module_id -> modules.id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_modules'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'client_modules_module_id_fkey'
    ) THEN
      ALTER TABLE public.client_modules
        ADD CONSTRAINT client_modules_module_id_fkey
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- employee_modules.module_id -> modules.id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_modules'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'employee_modules_module_id_fkey'
    ) THEN
      ALTER TABLE public.employee_modules
        ADD CONSTRAINT employee_modules_module_id_fkey
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

