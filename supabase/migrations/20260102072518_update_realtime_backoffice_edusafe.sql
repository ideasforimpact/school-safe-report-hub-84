BEGIN;

ALTER TABLE public.backoffice_edusafe_resource
REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'backoffice_edusafe_resource'
  ) THEN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.backoffice_edusafe_resource;
  END IF;
END;
$$;

COMMIT;
