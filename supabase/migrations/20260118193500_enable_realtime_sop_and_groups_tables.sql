-- Enable realtime for SOP and Groups related tables, only if not already enabled

DO $$
BEGIN
  -- Enable realtime for public.sop
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sop'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sop;
  END IF;

  -- Enable realtime for public.sop_assigned
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sop_assigned'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sop_assigned;
  END IF;

  -- Enable realtime for public.groups
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  END IF;

  -- Enable realtime for public.group_employees
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'group_employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_employees;
  END IF;
END
$$;








