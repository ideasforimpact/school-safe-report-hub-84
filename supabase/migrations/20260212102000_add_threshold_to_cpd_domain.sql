-- Migration no longer needed: we keep single "threshold" column on cpd_domain.
-- This script is kept as a safe no-op (and will also clean up an old threshold_hours
-- column if it was ever added in earlier experiments).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cpd_domain'
      AND column_name = 'threshold_hours'
  ) THEN
    ALTER TABLE public.cpd_domain
      DROP COLUMN threshold_hours;
  END IF;
END $$;

