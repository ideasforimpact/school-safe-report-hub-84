BEGIN;

-- 1. Enable FULL row data for realtime UPDATE/DELETE
ALTER TABLE public.incident_priorities
  REPLICA IDENTITY FULL;

ALTER TABLE public.incident_report_types
  REPLICA IDENTITY FULL;

ALTER TABLE public.incident_subcategories
  REPLICA IDENTITY FULL;

ALTER TABLE public.incident_categories
  REPLICA IDENTITY FULL;

ALTER TABLE public.contributing_factors
  REPLICA IDENTITY FULL;

-- 2. Add tables to supabase_realtime publication SAFELY
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'incident_priorities'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.incident_priorities;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'incident_report_types'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.incident_report_types;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'incident_subcategories'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.incident_subcategories;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'incident_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.incident_categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'contributing_factors'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.contributing_factors;
  END IF;
END $$;

COMMIT;
