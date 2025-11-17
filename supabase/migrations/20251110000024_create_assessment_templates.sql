-- Create assessment_templates table
-- This migration creates the assessment_templates table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assessment_templates'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.assessment_templates (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid,
      title text NOT NULL,
      description text,
      category_id uuid,
      questions jsonb DEFAULT '[]'::jsonb NOT NULL,
      created_by uuid,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      CONSTRAINT assessment_templates_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessment_templates_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessment_templates'
      ) THEN
        ALTER TABLE public.assessment_templates 
        ADD CONSTRAINT assessment_templates_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'template_categories') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessment_templates_category_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessment_templates'
      ) THEN
        ALTER TABLE public.assessment_templates 
        ADD CONSTRAINT assessment_templates_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessment_templates_created_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessment_templates'
      ) THEN
        ALTER TABLE public.assessment_templates 
        ADD CONSTRAINT assessment_templates_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_assessment_templates_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_assessment_templates_client_id ON public.assessment_templates USING btree (client_id);
    END IF;
  END IF;
END $$;

