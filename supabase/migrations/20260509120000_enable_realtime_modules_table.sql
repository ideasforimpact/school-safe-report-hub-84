-- Enable Realtime for the public.modules table.
-- This allows logged-in backoffice users to receive immediate updates
-- (active toggles, new modules, deletions) without re-logging in.

DO $$
BEGIN
  -- Only proceed if the supabase_realtime publication exists in this environment.
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'modules'
    ) THEN

      -- REPLICA IDENTITY FULL is required so realtime payloads include the
      -- full OLD row on UPDATE / DELETE — needed by clients that filter on
      -- old values (e.g. level='backoffice').
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'modules'
          AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.modules REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for public.modules';
      END IF;

      -- Add modules to the supabase_realtime publication if not already present.
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'modules'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;
        RAISE NOTICE 'Added public.modules to supabase_realtime publication';
      END IF;

    END IF;

  ELSE
    RAISE NOTICE 'supabase_realtime publication does not exist. Realtime may not be enabled in this environment.';
  END IF;
END $$;
