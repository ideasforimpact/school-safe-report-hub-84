-- Ensure title column exists in committee_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'committee_events'
      AND column_name = 'title'
  ) THEN
    ALTER TABLE public.committee_events
    ADD COLUMN title text;
  END IF;
END $$;

