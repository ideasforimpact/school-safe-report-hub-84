-- Create student_follow_up_entry table
-- Stores follow-up entries (date, notes) for student well-being records.
-- client_id required for RLS (multi-tenant scope).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'student_follow_up_entry'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.student_follow_up_entry (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      employee_id uuid,
      student_well_begin_management_id uuid NOT NULL,
      date date NOT NULL,
      notes text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT student_follow_up_entry_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.student_follow_up_entry IS 'Stores follow-up entries (date, notes) for student well-being records';

    -- FK to clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_follow_up_entry_client_id_fkey') THEN
        ALTER TABLE public.student_follow_up_entry
          ADD CONSTRAINT student_follow_up_entry_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to employees
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_follow_up_entry_employee_id_fkey') THEN
        ALTER TABLE public.student_follow_up_entry
          ADD CONSTRAINT student_follow_up_entry_employee_id_fkey
          FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to student_well_begin_management
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_well_begin_management') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_follow_up_entry_student_well_begin_management_id_fkey') THEN
        ALTER TABLE public.student_follow_up_entry
          ADD CONSTRAINT student_follow_up_entry_student_well_begin_management_id_fkey
          FOREIGN KEY (student_well_begin_management_id) REFERENCES public.student_well_begin_management(id) ON DELETE CASCADE;
      END IF;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_student_follow_up_entry_client_id ON public.student_follow_up_entry (client_id);
    CREATE INDEX IF NOT EXISTS idx_student_follow_up_entry_employee_id ON public.student_follow_up_entry (employee_id);
    CREATE INDEX IF NOT EXISTS idx_student_follow_up_entry_student_well_begin_management_id ON public.student_follow_up_entry (student_well_begin_management_id);
    CREATE INDEX IF NOT EXISTS idx_student_follow_up_entry_date ON public.student_follow_up_entry (date);
  END IF;
END $$;

-- Enable RLS (same policy pattern as student_consultation)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'student_follow_up_entry'
  ) THEN
    ALTER TABLE public.student_follow_up_entry ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authentication function access" ON public.student_follow_up_entry;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.student_follow_up_entry
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text
        OR current_setting('role'::text) = 'anon'::text
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can view student follow up entry from their client" ON public.student_follow_up_entry;
    BEGIN
      CREATE POLICY "Users can view student follow up entry from their client" ON public.student_follow_up_entry
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert student follow up entry for their client only" ON public.student_follow_up_entry;
    BEGIN
      CREATE POLICY "Users can insert student follow up entry for their client only" ON public.student_follow_up_entry
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update student follow up entry from their client only" ON public.student_follow_up_entry;
    BEGIN
      CREATE POLICY "Users can update student follow up entry from their client only" ON public.student_follow_up_entry
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete student follow up entry from their client only" ON public.student_follow_up_entry;
    BEGIN
      CREATE POLICY "Users can delete student follow up entry from their client only" ON public.student_follow_up_entry
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
