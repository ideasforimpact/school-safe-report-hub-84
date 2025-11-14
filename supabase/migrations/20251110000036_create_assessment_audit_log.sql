-- Create assessment_audit_log table
-- This migration creates the assessment_audit_log table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assessment_audit_log'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.assessment_audit_log (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      assessment_id uuid NOT NULL,
      client_id uuid,
      field_changed text NOT NULL,
      old_value text,
      new_value text,
      changed_by uuid,
      changed_at timestamp with time zone DEFAULT now() NOT NULL,
      change_type text DEFAULT 'field_update'::text NOT NULL,
      description text,
      metadata jsonb DEFAULT '{}'::jsonb,
      CONSTRAINT assessment_audit_log_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessment_audit_log_assessment_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessment_audit_log'
      ) THEN
        ALTER TABLE public.assessment_audit_log 
        ADD CONSTRAINT assessment_audit_log_assessment_id_fkey 
        FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessment_audit_log_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'assessment_audit_log'
      ) THEN
        ALTER TABLE public.assessment_audit_log 
        ADD CONSTRAINT assessment_audit_log_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_assessment_audit_log_assessment_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_assessment_audit_log_assessment_id ON public.assessment_audit_log USING btree (assessment_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_assessment_audit_log_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_assessment_audit_log_client_id ON public.assessment_audit_log USING btree (client_id);
    END IF;
  END IF;
END $$;

