-- Drop the legacy notification_templates table now that templates are managed in the frontend
-- Safe to run multiple times

BEGIN;

-- Revoke RLS and policies if they exist (no-op if absent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'notification_templates'
  ) THEN
    -- Disable RLS if it was enabled
    EXECUTE 'ALTER TABLE public.notification_templates DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Drop the table (and any dependent objects) if it exists
DROP TABLE IF EXISTS public.notification_templates CASCADE;

COMMIT; 