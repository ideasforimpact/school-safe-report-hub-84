-- Create student_wellbeing_audit_log table
-- Mirrors structure of incident_audit_log but for student well-being records

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_wellbeing_audit_log'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.student_wellbeing_audit_log (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      wellbeing_id uuid NOT NULL,
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
      CONSTRAINT student_wellbeing_audit_log_pkey PRIMARY KEY (id)
    );

    -- FK to student_well_begin_management
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'student_well_begin_management'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_student_wellbeing_audit_log_wellbeing_id'
          AND table_schema = 'public'
          AND table_name = 'student_wellbeing_audit_log'
      ) THEN
        ALTER TABLE public.student_wellbeing_audit_log 
          ADD CONSTRAINT fk_student_wellbeing_audit_log_wellbeing_id
          FOREIGN KEY (wellbeing_id) REFERENCES public.student_well_begin_management(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to clients
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'clients'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_wellbeing_audit_log_client_id_fkey'
          AND table_schema = 'public'
          AND table_name = 'student_wellbeing_audit_log'
      ) THEN
        ALTER TABLE public.student_wellbeing_audit_log 
          ADD CONSTRAINT student_wellbeing_audit_log_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_student_wellbeing_audit_log_wellbeing_id'
        AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_student_wellbeing_audit_log_wellbeing_id
        ON public.student_wellbeing_audit_log USING btree (wellbeing_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_student_wellbeing_audit_log_changed_at'
        AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_student_wellbeing_audit_log_changed_at
        ON public.student_wellbeing_audit_log USING btree (changed_at DESC);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_student_wellbeing_audit_log_changed_by'
        AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_student_wellbeing_audit_log_changed_by
        ON public.student_wellbeing_audit_log USING btree (changed_by);
    END IF;
  END IF;
END $$;

