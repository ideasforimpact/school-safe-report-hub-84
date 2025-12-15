-- Enable Realtime for visitors and visitor_kyc tables
-- This allows realtime subscriptions to work for visitor management notifications

DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    
    -- 1. Set REPLICA IDENTITY FULL for visitors (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'visitors'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'visitors'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.visitors REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for visitors';
      END IF;

      -- Add visitors to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'visitors'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;
        RAISE NOTICE 'Added visitors to supabase_realtime publication';
      END IF;
    END IF;

    -- 2. Set REPLICA IDENTITY FULL for visitor_kyc (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'visitor_kyc'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'visitor_kyc'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.visitor_kyc REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for visitor_kyc';
      END IF;

      -- Add visitor_kyc to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'visitor_kyc'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_kyc;
        RAISE NOTICE 'Added visitor_kyc to supabase_realtime publication';
      END IF;
    END IF;

  ELSE
    RAISE NOTICE 'supabase_realtime publication does not exist. Realtime may not be enabled.';
  END IF;
END $$;

