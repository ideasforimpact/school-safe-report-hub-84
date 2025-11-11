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

