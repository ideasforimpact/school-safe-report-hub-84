-- Create roles table
-- This migration creates the roles table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.roles (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      key text NOT NULL,
      description text,
      active boolean DEFAULT true NOT NULL,
      CONSTRAINT roles_pkey PRIMARY KEY (id),
      CONSTRAINT roles_key_key UNIQUE (key)
    );

    -- Add comment
    COMMENT ON TABLE public.roles IS 'Stores role definitions';
  END IF;
END $$;

