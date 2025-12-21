-- Enable Realtime for students, grades, sections, and campuses tables
-- This allows realtime subscriptions to work for student management notifications
-- When grades, sections, or campuses are updated, the student list will automatically refresh

DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    
    -- 1. Set REPLICA IDENTITY FULL for students (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'students'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'students'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.students REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for students';
      END IF;

      -- Add students to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'students'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
        RAISE NOTICE 'Added students to supabase_realtime publication';
      END IF;
    END IF;

    -- 2. Set REPLICA IDENTITY FULL for grades (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'grades'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'grades'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.grades REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for grades';
      END IF;

      -- Add grades to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'grades'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
        RAISE NOTICE 'Added grades to supabase_realtime publication';
      END IF;
    END IF;

    -- 3. Set REPLICA IDENTITY FULL for sections (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'sections'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'sections'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.sections REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for sections';
      END IF;

      -- Add sections to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'sections'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sections;
        RAISE NOTICE 'Added sections to supabase_realtime publication';
      END IF;
    END IF;

    -- 4. Set REPLICA IDENTITY FULL for campuses (required for realtime)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'campuses'
    ) THEN
      -- Check current replica identity
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'campuses'
        AND c.relreplident != 'f'  -- 'f' = FULL
      ) THEN
        ALTER TABLE public.campuses REPLICA IDENTITY FULL;
        RAISE NOTICE 'Set REPLICA IDENTITY FULL for campuses';
      END IF;

      -- Add campuses to supabase_realtime publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'campuses'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.campuses;
        RAISE NOTICE 'Added campuses to supabase_realtime publication';
      END IF;
    END IF;

  ELSE
    RAISE NOTICE 'supabase_realtime publication does not exist. Realtime may not be enabled.';
  END IF;
END $$;

