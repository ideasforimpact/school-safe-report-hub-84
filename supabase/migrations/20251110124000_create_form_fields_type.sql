-- Create form_fields_type table
-- This migration creates the form_fields_type table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'form_fields_type'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.form_fields_type (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      key text NOT NULL,
      CONSTRAINT form_fields_type_pkey PRIMARY KEY (id),
      CONSTRAINT form_fields_type_key_key UNIQUE (key)
    );
  END IF;
END $$;

