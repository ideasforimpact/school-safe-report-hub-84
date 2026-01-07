-- Add in_time column to trusted_vehicle table (datetime / timestamptz)
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
      AND column_name  = 'in_time'
  ) THEN
    ALTER TABLE public.trusted_vehicle
      ADD COLUMN in_time timestamptz;

    BEGIN
      COMMENT ON COLUMN public.trusted_vehicle.in_time IS 'Timestamp when trusted vehicle was marked as IN';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


