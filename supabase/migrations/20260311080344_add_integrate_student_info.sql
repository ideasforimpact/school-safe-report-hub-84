
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'student_well_begin_management'
  ) THEN
    -- Add JSONB column to persist external mapping metadata.
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'student_well_begin_management'
        AND column_name = 'integrated_student_info'
    ) THEN
      ALTER TABLE public.student_well_begin_management
        ADD COLUMN integrated_student_info jsonb;
    END IF;
 
    -- Allow student_id to be nullable for externally integrated records.
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'student_well_begin_management'
        AND column_name = 'student_id'
        AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE public.student_well_begin_management
        ALTER COLUMN student_id DROP NOT NULL;
    END IF;
  END IF;
END $$;