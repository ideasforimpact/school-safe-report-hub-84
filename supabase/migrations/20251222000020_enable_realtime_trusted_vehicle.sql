-- Enable realtime for trusted_vehicle table

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
ALTER TABLE public.trusted_vehicle REPLICA IDENTITY FULL;

-- Add trusted_vehicle table to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trusted_vehicle'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.trusted_vehicle;
  END IF;
END $$;


