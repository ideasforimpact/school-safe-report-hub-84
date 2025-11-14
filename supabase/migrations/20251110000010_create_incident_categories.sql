-- Create incident_categories table
-- This migration creates the incident_categories table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_categories'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.incident_categories (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid,
      name text NOT NULL,
      description text,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT incident_categories_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_categories_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'incident_categories'
      ) THEN
        ALTER TABLE public.incident_categories 
        ADD CONSTRAINT incident_categories_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_categories_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_categories_client_id ON public.incident_categories USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'incident_categories_client_id_idx' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX incident_categories_client_id_idx ON public.incident_categories USING btree (client_id);
    END IF;
  END IF;
END $$;

