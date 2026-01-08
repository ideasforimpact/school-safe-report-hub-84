-- Enable Realtime for client_integration table
-- This allows realtime subscriptions to work for client_integration changes
-- When client_integration is updated in backoffice, client views will automatically reflect the changes

DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    
    -- Set REPLICA IDENTITY FULL for client_integration (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'client_integration'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'client_integration'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.client_integration REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for client_integration';
      END IF;

      -- Add client_integration to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'client_integration'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.client_integration;
        RAISE NOTICE 'Added client_integration to supabase_realtime publication';
      END IF;
    END IF;
  END IF;
END $$;

