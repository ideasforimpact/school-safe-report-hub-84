-- Add status (enum) and next_follow_up (date) to student_well_begin_management
-- For databases that already ran the create migration without these columns

DO $$
BEGIN
  -- Create enum type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_wellbeing_status') THEN
    CREATE TYPE public.student_wellbeing_status AS ENUM ('open', 'closed', 'under_observation');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_well_begin_management') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_well_begin_management' AND column_name = 'status') THEN
      ALTER TABLE public.student_well_begin_management
        ADD COLUMN status public.student_wellbeing_status DEFAULT 'open' NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_status ON public.student_well_begin_management (status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_well_begin_management' AND column_name = 'next_follow_up') THEN
      ALTER TABLE public.student_well_begin_management
        ADD COLUMN next_follow_up date;
      CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_next_follow_up ON public.student_well_begin_management (next_follow_up);
    END IF;
  END IF;
END $$;
