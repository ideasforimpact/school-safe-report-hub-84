-- Enable realtime for student_well_begin_management and student_consultation tables

DO $$
BEGIN
  -- Enable realtime for public.student_well_begin_management
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_well_begin_management'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_well_begin_management;
  END IF;

  -- Enable realtime for public.student_consultation
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_consultation'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_consultation;
  END IF;
END $$;
