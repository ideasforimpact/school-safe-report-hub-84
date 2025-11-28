-- Add foreign key columns to students table
-- This migration adds campus_id, grade_id, and section_id columns with foreign key constraints

DO $$
BEGIN
  -- Add campus_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'campus_id'
  ) THEN
    ALTER TABLE public.students 
    ADD COLUMN campus_id uuid;
  END IF;

  -- Add grade_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'grade_id'
  ) THEN
    ALTER TABLE public.students 
    ADD COLUMN grade_id uuid;
  END IF;

  -- Add section_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'section_id'
  ) THEN
    ALTER TABLE public.students 
    ADD COLUMN section_id uuid;
  END IF;

  -- Add foreign key constraint for campus_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campuses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'students_campus_id_fkey' 
      AND table_schema = 'public' 
      AND table_name = 'students'
    ) THEN
      ALTER TABLE public.students 
      ADD CONSTRAINT students_campus_id_fkey 
      FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add foreign key constraint for grade_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grades') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'students_grade_id_fkey' 
      AND table_schema = 'public' 
      AND table_name = 'students'
    ) THEN
      ALTER TABLE public.students 
      ADD CONSTRAINT students_grade_id_fkey 
      FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add foreign key constraint for section_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sections') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'students_section_id_fkey' 
      AND table_schema = 'public' 
      AND table_name = 'students'
    ) THEN
      ALTER TABLE public.students 
      ADD CONSTRAINT students_section_id_fkey 
      FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Create index for campus_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_students_campus_id' 
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_students_campus_id ON public.students USING btree (campus_id);
  END IF;

  -- Create index for grade_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_students_grade_id' 
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_students_grade_id ON public.students USING btree (grade_id);
  END IF;

  -- Create index for section_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_students_section_id' 
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_students_section_id ON public.students USING btree (section_id);
  END IF;

  -- Optional: Try to populate existing data by matching names
  -- This will attempt to map existing text values to IDs
  -- Note: This assumes exact name matches and may not work for all cases
  
  -- Update campus_id from campus text field
  UPDATE public.students s
  SET campus_id = c.id
  FROM public.campuses c
  WHERE s.campus = c.name 
    AND s.client_id = c.client_id
    AND s.campus_id IS NULL;

  -- Update grade_id from grade text field
  -- Note: This requires matching both grade name and campus
  UPDATE public.students s
  SET grade_id = g.id
  FROM public.grades g
  WHERE s.grade = g.name 
    AND s.client_id = g.client_id
    AND s.campus_id = g.campus_id
    AND s.grade_id IS NULL;

  -- Update section_id from section text field
  -- Note: This requires matching section name, grade, and campus
  UPDATE public.students s
  SET section_id = sec.id
  FROM public.sections sec
  WHERE s.section = sec.name 
    AND s.client_id = sec.client_id
    AND s.grade_id = sec.grade_id
    AND s.campus_id = sec.campus_id
    AND s.section_id IS NULL;

END $$;

