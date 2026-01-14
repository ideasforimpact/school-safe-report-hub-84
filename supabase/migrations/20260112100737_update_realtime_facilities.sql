-- Enable realtime for facilities table

-- Ensure the supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Ensure UPDATE/DELETE events include previous row values
ALTER TABLE public.facilities REPLICA IDENTITY FULL;

-- Add facilities table to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'facilities'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.facilities;
  END IF;
END $$;


