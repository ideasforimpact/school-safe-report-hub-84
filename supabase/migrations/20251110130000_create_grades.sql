-- Create grades table
-- This migration creates the grades table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'grades'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.grades (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      client_id uuid NOT NULL,
      campus_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT grades_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'grades_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'grades'
      ) THEN
        ALTER TABLE public.grades 
        ADD CONSTRAINT grades_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campuses') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'grades_campus_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'grades'
      ) THEN
        ALTER TABLE public.grades 
        ADD CONSTRAINT grades_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_grades_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_grades_client_id ON public.grades USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_grades_campus_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_grades_campus_id ON public.grades USING btree (campus_id);
    END IF;
  END IF;
END $$;

