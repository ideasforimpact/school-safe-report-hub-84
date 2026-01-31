-- Create student_consultation table
-- Stores consultation records with provider, date, mode, and support notes.
-- client_id is required for RLS (multi-tenant scope).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_consultation'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.student_consultation (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      employee_id uuid,
      student_well_begin_management_id uuid,
      consultation_provided_by text NOT NULL,
      consultation_date date NOT NULL,
      mode_id uuid NOT NULL,
      support_notes text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT student_consultation_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.student_consultation IS 'Stores student consultation records (provider, date, mode, notes)';

    -- FK to clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_consultation_client_id_fkey') THEN
        ALTER TABLE public.student_consultation
          ADD CONSTRAINT student_consultation_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to employees
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_consultation_employee_id_fkey') THEN
        ALTER TABLE public.student_consultation
          ADD CONSTRAINT student_consultation_employee_id_fkey
          FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to student_well_begin_management
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_well_begin_management') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_consultation_student_well_begin_management_id_fkey') THEN
        ALTER TABLE public.student_consultation
          ADD CONSTRAINT student_consultation_student_well_begin_management_id_fkey
          FOREIGN KEY (student_well_begin_management_id) REFERENCES public.student_well_begin_management(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to consultation_mode
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_mode') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_consultation_mode_id_fkey') THEN
        ALTER TABLE public.student_consultation
          ADD CONSTRAINT student_consultation_mode_id_fkey
          FOREIGN KEY (mode_id) REFERENCES public.consultation_mode(id) ON DELETE RESTRICT;
      END IF;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_student_consultation_client_id ON public.student_consultation (client_id);
    CREATE INDEX IF NOT EXISTS idx_student_consultation_student_well_begin_management_id ON public.student_consultation (student_well_begin_management_id);
    CREATE INDEX IF NOT EXISTS idx_student_consultation_employee_id ON public.student_consultation (employee_id);
    CREATE INDEX IF NOT EXISTS idx_student_consultation_mode_id ON public.student_consultation (mode_id);
    CREATE INDEX IF NOT EXISTS idx_student_consultation_consultation_date ON public.student_consultation (consultation_date);
  END IF;
END $$;

-- Enable RLS (scope by client_id, like employees)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_consultation'
  ) THEN
    ALTER TABLE public.student_consultation ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authentication function access" ON public.student_consultation;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.student_consultation
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can view student consultation from their client" ON public.student_consultation;
    BEGIN
      CREATE POLICY "Users can view student consultation from their client" ON public.student_consultation
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert student consultation for their client only" ON public.student_consultation;
    BEGIN
      CREATE POLICY "Users can insert student consultation for their client only" ON public.student_consultation
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update student consultation from their client only" ON public.student_consultation;
    BEGIN
      CREATE POLICY "Users can update student consultation from their client only" ON public.student_consultation
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete student consultation from their client only" ON public.student_consultation;
    BEGIN
      CREATE POLICY "Users can delete student consultation from their client only" ON public.student_consultation
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
