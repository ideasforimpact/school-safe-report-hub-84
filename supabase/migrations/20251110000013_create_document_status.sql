-- Create document_status table
-- This migration creates the document_status table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'document_status'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.document_status (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      description text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT document_status_pkey PRIMARY KEY (id),
      CONSTRAINT document_status_name_key UNIQUE (name)
    );
  END IF;
END $$;

