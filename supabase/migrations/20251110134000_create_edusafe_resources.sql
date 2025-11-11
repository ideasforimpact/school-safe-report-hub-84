-- Create edusafe_resources table
-- This migration creates the edusafe_resources table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'edusafe_resources'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.edusafe_resources (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      description text,
      category text NOT NULL,
      tags jsonb DEFAULT '[]'::jsonb,
      document_url text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      uploaded_by uuid,
      client_id uuid,
      youtube_link text,
      CONSTRAINT edusafe_resources_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'edusafe_resources_uploaded_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'edusafe_resources'
      ) THEN
        ALTER TABLE public.edusafe_resources 
        ADD CONSTRAINT edusafe_resources_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'edusafe_resources_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'edusafe_resources'
      ) THEN
        ALTER TABLE public.edusafe_resources 
        ADD CONSTRAINT edusafe_resources_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_edusafe_resources_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_edusafe_resources_client_id ON public.edusafe_resources USING btree (client_id);
    END IF;
  END IF;
END $$;

