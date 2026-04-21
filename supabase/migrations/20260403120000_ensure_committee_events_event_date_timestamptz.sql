-- Ensure committee_events.event_date stores date + time (not date-only).
-- Idempotent: skips if the column is already timestamptz (e.g. after 20260309100009).

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'committee_events'
      AND column_name = 'event_date'
      AND udt_name = 'date'
  ) THEN
    ALTER TABLE public.committee_events
      ALTER COLUMN event_date TYPE timestamptz
      USING (event_date::timestamptz);
  END IF;
END $migration$;
