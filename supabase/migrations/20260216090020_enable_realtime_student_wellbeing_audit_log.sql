-- Enable realtime for student_wellbeing_audit_log table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_wellbeing_audit_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime 
      ADD TABLE public.student_wellbeing_audit_log;
  END IF;
END $$;

