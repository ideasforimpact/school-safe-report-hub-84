-- Enable realtime for cpd_domain and cpd_entries tables

DO $$
BEGIN
  -- Enable realtime for public.cpd_domain
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cpd_domain'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'cpd_domain'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cpd_domain;
    END IF;
  END IF;

  -- Enable realtime for public.cpd_entries
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cpd_entries'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'cpd_entries'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cpd_entries;
    END IF;
  END IF;
END $$;

