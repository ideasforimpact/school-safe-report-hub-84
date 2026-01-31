-- Create student_well_begin_management table
-- Stores student well-being concerns linked to students, sections, grades, and concern type

-- Create enum type for status (open, closed, under_observation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_wellbeing_status') THEN
    CREATE TYPE public.student_wellbeing_status AS ENUM ('open', 'closed', 'under_observation');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_well_begin_management'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.student_well_begin_management (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      employee_id uuid,
      student_id uuid NOT NULL,
      section_id uuid,
      grade_id uuid,
      type_of_concern_id uuid NOT NULL,
      date_of_observation timestamp with time zone NOT NULL,
      concern text,
      status public.student_wellbeing_status DEFAULT 'open' NOT NULL,
      next_follow_up date,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT student_well_begin_management_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.student_well_begin_management IS 'Stores student well-being concerns and observations';

    -- FK to clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_well_begin_management_client_id_fkey') THEN
        ALTER TABLE public.student_well_begin_management
          ADD CONSTRAINT student_well_begin_management_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to employees
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_well_begin_management_employee_id_fkey') THEN
        ALTER TABLE public.student_well_begin_management
          ADD CONSTRAINT student_well_begin_management_employee_id_fkey
          FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to students
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_well_begin_management_student_id_fkey') THEN
        ALTER TABLE public.student_well_begin_management
          ADD CONSTRAINT student_well_begin_management_student_id_fkey
          FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to sections
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sections') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_well_begin_management_section_id_fkey') THEN
        ALTER TABLE public.student_well_begin_management
          ADD CONSTRAINT student_well_begin_management_section_id_fkey
          FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to grades
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grades') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_well_begin_management_grade_id_fkey') THEN
        ALTER TABLE public.student_well_begin_management
          ADD CONSTRAINT student_well_begin_management_grade_id_fkey
          FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to general_concern
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'general_concern') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_well_begin_management_type_of_concern_id_fkey') THEN
        ALTER TABLE public.student_well_begin_management
          ADD CONSTRAINT student_well_begin_management_type_of_concern_id_fkey
          FOREIGN KEY (type_of_concern_id) REFERENCES public.general_concern(id) ON DELETE RESTRICT;
      END IF;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_client_id ON public.student_well_begin_management (client_id);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_employee_id ON public.student_well_begin_management (employee_id);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_student_id ON public.student_well_begin_management (student_id);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_section_id ON public.student_well_begin_management (section_id);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_grade_id ON public.student_well_begin_management (grade_id);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_type_of_concern_id ON public.student_well_begin_management (type_of_concern_id);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_date_of_observation ON public.student_well_begin_management (date_of_observation);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_status ON public.student_well_begin_management (status);
    CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_next_follow_up ON public.student_well_begin_management (next_follow_up);
  END IF;
END $$;

-- Enable RLS (scope by client_id, like employees)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_well_begin_management'
  ) THEN
    ALTER TABLE public.student_well_begin_management ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authentication function access" ON public.student_well_begin_management;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.student_well_begin_management
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can view student well-being from their client" ON public.student_well_begin_management;
    BEGIN
      CREATE POLICY "Users can view student well-being from their client" ON public.student_well_begin_management
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert student well-being for their client only" ON public.student_well_begin_management;
    BEGIN
      CREATE POLICY "Users can insert student well-being for their client only" ON public.student_well_begin_management
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update student well-being from their client only" ON public.student_well_begin_management;
    BEGIN
      CREATE POLICY "Users can update student well-being from their client only" ON public.student_well_begin_management
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete student well-being from their client only" ON public.student_well_begin_management;
    BEGIN
      CREATE POLICY "Users can delete student well-being from their client only" ON public.student_well_begin_management
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
