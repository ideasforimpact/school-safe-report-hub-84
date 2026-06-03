-- Add is_skipped + skipped_notifications columns to source tables that trigger notifications.
--
-- Background:
--   The notification rules can skip an email send (self-action, inactive user, no email).
--   Previously these skips were recorded only in notification_logs, mixed in with sent/failed rows.
--   This made it expensive to answer "show me incidents whose notification was suppressed",
--   and impossible to answer it at all if we stop writing skipped rows to notification_logs
--   (which we now do — see notificationService.ts).
--
-- Design (Option B from the audit):
--   is_skipped              : sticky boolean. Once true, never reverts. Fast filter column.
--   skipped_notifications   : append-only jsonb array. Each entry is
--                             { type, reason, recipient_id, skipped_at }.
--                             Gives us audit detail without bloating notification_logs.
--
-- Not adding to form_submissions/grievances — grievance notifications bypass the skip
-- check entirely in notificationService, so the column would be dead weight there.

DO $$
BEGIN
  -- incidents
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'incidents'
  ) THEN
    ALTER TABLE public.incidents
      ADD COLUMN IF NOT EXISTS is_skipped boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS skipped_notifications jsonb NOT NULL DEFAULT '[]'::jsonb;

    -- Partial index: we only care about the rows where is_skipped = true.
    -- Keeps the index tiny since skips are rare.
    CREATE INDEX IF NOT EXISTS idx_incidents_is_skipped
      ON public.incidents (is_skipped)
      WHERE is_skipped = true;
  END IF;

  -- assessments
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    ALTER TABLE public.assessments
      ADD COLUMN IF NOT EXISTS is_skipped boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS skipped_notifications jsonb NOT NULL DEFAULT '[]'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_assessments_is_skipped
      ON public.assessments (is_skipped)
      WHERE is_skipped = true;
  END IF;
END $$;
