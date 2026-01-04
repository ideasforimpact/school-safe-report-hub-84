-- Create incident_external_students table
-- This migration creates the incident_external_students table to link incidents with external students

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_external_students'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.incident_external_students (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      incident_id uuid NOT NULL,
      external_student_id uuid NOT NULL,
      external_client_id uuid,
      client_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT incident_external_students_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint for incident_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_external_students_incident_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'incident_external_students'
      ) THEN
        ALTER TABLE public.incident_external_students 
        ADD CONSTRAINT incident_external_students_incident_id_fkey 
        FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Add foreign key constraint for external_student_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'external_students') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_external_students_external_student_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'incident_external_students'
      ) THEN
        ALTER TABLE public.incident_external_students 
        ADD CONSTRAINT incident_external_students_external_student_id_fkey 
        FOREIGN KEY (external_student_id) REFERENCES public.external_students(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Add foreign key constraint for client_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_external_students_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'incident_external_students'
      ) THEN
        ALTER TABLE public.incident_external_students 
        ADD CONSTRAINT incident_external_students_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_external_students_incident_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_external_students_incident_id ON public.incident_external_students USING btree (incident_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_external_students_external_student_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_external_students_external_student_id ON public.incident_external_students USING btree (external_student_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_external_students_external_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_external_students_external_client_id ON public.incident_external_students USING btree (external_client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_external_students_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_external_students_client_id ON public.incident_external_students USING btree (client_id);
    END IF;

    -- Create unique constraint to prevent duplicate incident-external_student pairs
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'incident_external_students_incident_external_student_unique' 
      AND table_schema = 'public' 
      AND table_name = 'incident_external_students'
    ) THEN
      CREATE UNIQUE INDEX incident_external_students_incident_external_student_unique 
      ON public.incident_external_students (incident_id, external_student_id);
    END IF;

    RAISE NOTICE 'Created incident_external_students table';
  ELSE
    RAISE NOTICE 'Table incident_external_students already exists';
    
    -- Check if client_id column exists, if not add it
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'incident_external_students'
      AND column_name = 'client_id'
    ) THEN
      -- Add client_id column (nullable first, then we'll update it)
      ALTER TABLE public.incident_external_students
      ADD COLUMN client_id uuid;
      
      -- Update existing rows: get client_id from incidents table
      UPDATE public.incident_external_students ies
      SET client_id = i.client_id
      FROM public.incidents i
      WHERE ies.incident_id = i.id
      AND ies.client_id IS NULL;
      
      -- Make it NOT NULL after populating
      ALTER TABLE public.incident_external_students
      ALTER COLUMN client_id SET NOT NULL;
      
      -- Add foreign key constraint for client_id if it doesn't exist
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'incident_external_students_client_id_fkey' 
          AND table_schema = 'public' 
          AND table_name = 'incident_external_students'
        ) THEN
          ALTER TABLE public.incident_external_students 
          ADD CONSTRAINT incident_external_students_client_id_fkey 
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
        END IF;
      END IF;
      
      -- Create index for client_id if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_incident_external_students_client_id' 
        AND schemaname = 'public'
      ) THEN
        CREATE INDEX idx_incident_external_students_client_id ON public.incident_external_students USING btree (client_id);
      END IF;
      
      RAISE NOTICE 'Added client_id column to existing incident_external_students table';
    ELSE
      RAISE NOTICE 'Column client_id already exists in incident_external_students table';
    END IF;
  END IF;
END $$;

