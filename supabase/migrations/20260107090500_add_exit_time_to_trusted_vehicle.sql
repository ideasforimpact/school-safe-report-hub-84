-- Add exit_time column to trusted_vehicle table (date only)
-- Idempotent: only adds the column if it does not already exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'trusted_vehicle'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'trusted_vehicle'
      AND column_name  = 'exit_time'
  ) THEN
    ALTER TABLE public.trusted_vehicle
      ADD COLUMN exit_time date;

    BEGIN
      COMMENT ON COLUMN public.trusted_vehicle.exit_time IS 'Date when trusted vehicle exited (if applicable)';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


