-- Create campuses table
-- This migration creates the campuses table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'campuses'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.campuses (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      client_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT campuses_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campuses_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'campuses'
      ) THEN
        ALTER TABLE public.campuses 
        ADD CONSTRAINT campuses_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_campuses_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_campuses_client_id ON public.campuses USING btree (client_id);
    END IF;

    -- Add comment
    COMMENT ON TABLE public.campuses IS 'Stores campus information for clients';
  END IF;
END $$;

