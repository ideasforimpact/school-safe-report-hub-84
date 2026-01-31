-- Create consultation_action_take table
-- Stores actions taken for student well-being records (date, description).
-- client_id and student_well_begin_management_id for RLS and relationship.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'consultation_action_take'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.consultation_action_take (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      student_well_begin_management_id uuid NOT NULL,
      client_id uuid NOT NULL,
      employee_id uuid,
      taken_date date NOT NULL,
      description text NOT NULL,
      is_deleted boolean NOT NULL DEFAULT false,
      deleted_at timestamp with time zone NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT consultation_action_take_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.consultation_action_take IS 'Stores actions taken for student well-being records (date, description)';

    -- FK to student_well_begin_management
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_well_begin_management') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultation_action_take_student_well_begin_management_id_fkey') THEN
        ALTER TABLE public.consultation_action_take
          ADD CONSTRAINT consultation_action_take_student_well_begin_management_id_fkey
          FOREIGN KEY (student_well_begin_management_id) REFERENCES public.student_well_begin_management(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultation_action_take_client_id_fkey') THEN
        ALTER TABLE public.consultation_action_take
          ADD CONSTRAINT consultation_action_take_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to employees
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultation_action_take_employee_id_fkey') THEN
        ALTER TABLE public.consultation_action_take
          ADD CONSTRAINT consultation_action_take_employee_id_fkey
          FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
      END IF;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_consultation_action_take_client_id ON public.consultation_action_take (client_id);
    CREATE INDEX IF NOT EXISTS idx_consultation_action_take_student_well_begin_management_id ON public.consultation_action_take (student_well_begin_management_id);
    CREATE INDEX IF NOT EXISTS idx_consultation_action_take_employee_id ON public.consultation_action_take (employee_id);
    CREATE INDEX IF NOT EXISTS idx_consultation_action_take_taken_date ON public.consultation_action_take (taken_date);
    CREATE INDEX IF NOT EXISTS idx_consultation_action_take_is_deleted ON public.consultation_action_take (is_deleted);
  END IF;
END $$;

-- Enable RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'consultation_action_take'
  ) THEN
    ALTER TABLE public.consultation_action_take ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authentication function access" ON public.consultation_action_take;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.consultation_action_take
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text
        OR current_setting('role'::text) = 'anon'::text
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can view consultation action from their client" ON public.consultation_action_take;
    BEGIN
      CREATE POLICY "Users can view consultation action from their client" ON public.consultation_action_take
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert consultation action for their client only" ON public.consultation_action_take;
    BEGIN
      CREATE POLICY "Users can insert consultation action for their client only" ON public.consultation_action_take
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update consultation action from their client only" ON public.consultation_action_take;
    BEGIN
      CREATE POLICY "Users can update consultation action from their client only" ON public.consultation_action_take
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete consultation action from their client only" ON public.consultation_action_take;
    BEGIN
      CREATE POLICY "Users can delete consultation action from their client only" ON public.consultation_action_take
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
