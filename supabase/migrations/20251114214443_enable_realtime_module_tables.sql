-- Enable Realtime for client_modules and employee_modules tables
-- This allows realtime subscriptions to work for module assignment notifications

DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    
    -- 1. Set REPLICA IDENTITY FULL for client_modules (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'client_modules'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'client_modules'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.client_modules REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for client_modules';
      END IF;

      -- Add client_modules to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'client_modules'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.client_modules;
        RAISE NOTICE 'Added client_modules to supabase_realtime publication';
      END IF;
    END IF;

    -- 2. Ensure employee_modules has REPLICA IDENTITY FULL (should already be set, but verify)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'employee_modules'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'employee_modules'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.employee_modules REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for employee_modules';
      END IF;

      -- Add employee_modules to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'employee_modules'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_modules;
        RAISE NOTICE 'Added employee_modules to supabase_realtime publication';
      END IF;
    END IF;

  ELSE
    RAISE NOTICE 'supabase_realtime publication does not exist. Realtime may not be enabled.';
  END IF;
END $$;

