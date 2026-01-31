-- Enable realtime for student_follow_up_entry table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_follow_up_entry'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_follow_up_entry;
  END IF;
END $$;
