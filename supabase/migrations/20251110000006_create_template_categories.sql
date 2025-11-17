-- Create template_categories table
-- This migration creates the template_categories table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'template_categories'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.template_categories (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      description text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT template_categories_pkey PRIMARY KEY (id)
    );
  END IF;
END $$;

