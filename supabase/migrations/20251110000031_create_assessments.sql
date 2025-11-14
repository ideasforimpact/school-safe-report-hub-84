-- Create assessments table
-- This migration creates the assessments table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'assessments_assessment_id_seq') THEN
      CREATE SEQUENCE IF NOT EXISTS public.assessments_assessment_id_seq;
    END IF;

    CREATE TABLE IF NOT EXISTS public.assessments (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid,
      name text NOT NULL,
      description text,
      template_id uuid,
      status text DEFAULT 'New'::text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      created_by uuid,
      assigned_to uuid,
      target_completion_date date,
      score integer DEFAULT 0,
      assessment_id integer NOT NULL DEFAULT nextval('public.assessments_assessment_id_seq'::regclass),
      answers jsonb DEFAULT '[]'::jsonb,
      completed_by uuid,
      completed_on timestamp with time zone,
      closure_comments text,
      rework_comments text,
      CONSTRAINT assessments_pkey PRIMARY KEY (id),
      CONSTRAINT assessments_status_check CHECK (
        status = ANY (ARRAY['New'::text, 'Draft'::text, 'In Progress'::text, 'Submitted'::text, 'Completed'::text])
      ),
      CONSTRAINT assessments_assessment_id_unique UNIQUE (assessment_id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessments_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessments'
      ) THEN
        ALTER TABLE public.assessments 
        ADD CONSTRAINT assessments_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_templates') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessments_template_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessments'
      ) THEN
        ALTER TABLE public.assessments 
        ADD CONSTRAINT assessments_template_id_fkey 
        FOREIGN KEY (template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessments_created_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessments'
      ) THEN
        ALTER TABLE public.assessments 
        ADD CONSTRAINT assessments_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessments_assigned_to_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessments'
      ) THEN
        ALTER TABLE public.assessments 
        ADD CONSTRAINT assessments_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessments_completed_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessments'
      ) THEN
        ALTER TABLE public.assessments 
        ADD CONSTRAINT assessments_completed_by_fkey 
        FOREIGN KEY (completed_by) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_assessments_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_assessments_client_id ON public.assessments USING btree (client_id);
    END IF;
  END IF;
END $$;

