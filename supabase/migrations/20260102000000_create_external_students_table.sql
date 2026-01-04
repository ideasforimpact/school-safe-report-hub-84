-- Create external_students table
-- This migration creates the external_students table to store student records from external clients

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'external_students'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.external_students (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      external_client_id uuid NOT NULL,
      external_student_id uuid NOT NULL,
      student_id text NOT NULL,
      name text NOT NULL,
      is_external boolean DEFAULT true NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      student_info jsonb DEFAULT '{}'::jsonb,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT external_students_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint for client_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'external_students_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'external_students'
      ) THEN
        ALTER TABLE public.external_students 
        ADD CONSTRAINT external_students_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

   

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_external_students_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_external_students_client_id ON public.external_students USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_external_students_external_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_external_students_external_client_id ON public.external_students USING btree (external_client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_external_students_student_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_external_students_student_id ON public.external_students USING btree (student_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_external_students_external_student_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_external_students_external_student_id ON public.external_students USING btree (external_student_id);
    END IF;

    RAISE NOTICE 'Created external_students table';
  ELSE
    RAISE NOTICE 'Table external_students already exists';
  END IF;
END $$;

