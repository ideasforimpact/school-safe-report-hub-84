-- enable-realtime-employee_documents.up.sql
DO $$
BEGIN
  -- Create publication if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add the employee_documents table to the publication if not already added
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND pr.prrelid = 'public.employee_documents'::regclass
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_documents;
  END IF;
END
$$;
