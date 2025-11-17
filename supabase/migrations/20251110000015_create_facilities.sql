-- Create facilities table
-- This migration creates the facilities table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'facilities'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.facilities (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      client_id uuid NOT NULL,
      campus_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT facilities_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'facilities_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'facilities'
      ) THEN
        ALTER TABLE public.facilities 
        ADD CONSTRAINT facilities_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campuses') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'facilities_campus_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'facilities'
      ) THEN
        ALTER TABLE public.facilities 
        ADD CONSTRAINT facilities_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_facilities_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_facilities_client_id ON public.facilities USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_facilities_campus_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_facilities_campus_id ON public.facilities USING btree (campus_id);
    END IF;
  END IF;
END $$;

