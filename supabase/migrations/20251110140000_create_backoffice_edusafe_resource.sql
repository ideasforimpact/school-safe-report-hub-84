-- Create backoffice_edusafe_resource table
-- This migration creates the backoffice_edusafe_resource table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_edusafe_resource'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.backoffice_edusafe_resource (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      description text,
      category text NOT NULL,
      tags jsonb DEFAULT '[]'::jsonb,
      document_url text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      uploaded_by uuid,
      client_type_id uuid,
      CONSTRAINT backoffice_edusafe_resource_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backoffice_users') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backoffice_edusafe_resource_uploaded_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'backoffice_edusafe_resource'
      ) THEN
        ALTER TABLE public.backoffice_edusafe_resource 
        ADD CONSTRAINT backoffice_edusafe_resource_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.backoffice_users(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_type') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backoffice_edusafe_resource_client_type_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'backoffice_edusafe_resource'
      ) THEN
        ALTER TABLE public.backoffice_edusafe_resource 
        ADD CONSTRAINT backoffice_edusafe_resource_client_type_id_fkey 
        FOREIGN KEY (client_type_id) REFERENCES public.client_type(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_backoffice_edusafe_resource_client_type_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_backoffice_edusafe_resource_client_type_id ON public.backoffice_edusafe_resource USING btree (client_type_id);
    END IF;
  END IF;
END $$;

