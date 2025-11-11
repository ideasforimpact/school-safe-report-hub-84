-- Create incident_audit_log table
-- This migration creates the incident_audit_log table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_audit_log'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.incident_audit_log (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      incident_id uuid NOT NULL,
      field_changed text NOT NULL,
      old_value text,
      new_value text,
      changed_by uuid NOT NULL,
      changed_at timestamp with time zone DEFAULT now() NOT NULL,
      change_type text DEFAULT 'update'::text NOT NULL,
      description text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      client_id uuid,
      changes jsonb DEFAULT '[]'::jsonb,
      CONSTRAINT incident_audit_log_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_incident_audit_log_incident_id' 
        AND table_schema = 'public' 
        AND table_name = 'incident_audit_log'
      ) THEN
        ALTER TABLE public.incident_audit_log 
        ADD CONSTRAINT fk_incident_audit_log_incident_id 
        FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_audit_log_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'incident_audit_log'
      ) THEN
        ALTER TABLE public.incident_audit_log 
        ADD CONSTRAINT incident_audit_log_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_audit_log_incident_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_audit_log_incident_id ON public.incident_audit_log USING btree (incident_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_audit_log_changed_at' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_audit_log_changed_at ON public.incident_audit_log USING btree (changed_at DESC);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_audit_log_changed_by' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_audit_log_changed_by ON public.incident_audit_log USING btree (changed_by);
    END IF;
  END IF;
END $$;

