-- Store MOM/event date+time as entered (no UTC offset in the column).
-- timestamptz always serializes as UTC (+00); timestamp without time zone keeps wall-clock values.

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'committee_events'
      AND column_name = 'event_date'
      AND udt_name = 'timestamp'
  ) THEN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'committee_events'
      AND column_name = 'event_date'
      AND udt_name = 'timestamptz'
  ) THEN
    ALTER TABLE public.committee_events
      ALTER COLUMN event_date TYPE timestamp without time zone
      USING ((event_date AT TIME ZONE 'UTC'));
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'committee_events'
      AND column_name = 'event_date'
      AND udt_name = 'date'
  ) THEN
    ALTER TABLE public.committee_events
      ALTER COLUMN event_date TYPE timestamp without time zone
      USING (event_date::timestamp);
  END IF;
  END IF;
END $migration$;
