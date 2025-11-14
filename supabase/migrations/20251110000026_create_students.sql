-- Create students table
-- This migration creates the students table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'students'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.students (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      student_id text NOT NULL,
      name text NOT NULL,
      grade text NOT NULL,
      section text NOT NULL,
      campus text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      client_id uuid,
      CONSTRAINT students_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'students'
      ) THEN
        ALTER TABLE public.students 
        ADD CONSTRAINT students_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_students_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_students_client_id ON public.students USING btree (client_id);
    END IF;
  END IF;
END $$;

