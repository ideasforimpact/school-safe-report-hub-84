-- Create employee_document_type table
-- This migration creates the employee_document_type table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_document_type'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.employee_document_type (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      description text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT employee_document_type_pkey PRIMARY KEY (id),
      CONSTRAINT employee_document_type_name_key UNIQUE (name)
    );
  END IF;
END $$;

