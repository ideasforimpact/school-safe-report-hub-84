-- Add exit_time column to visitors table (datetime / timestamptz)
-- Idempotent: only adds the column if it does not already exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'visitors'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'visitors'
      AND column_name  = 'exit_time'
  ) THEN
    ALTER TABLE public.visitors
      ADD COLUMN exit_time timestamptz;

    BEGIN
      COMMENT ON COLUMN public.visitors.exit_time IS 'Timestamp when visitor exited the premises';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


