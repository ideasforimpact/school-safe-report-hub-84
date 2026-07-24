-- Add dedicated (unmasked) chassis and engine number columns to vehicles table
-- These hold the real values fetched via the vehicle-unmask edge function when the
-- primary masked RC endpoint returns masked chassis/engine values.
-- This migration is idempotent and can be safely rerun.

DO $$
BEGIN
  -- Add vehicle_chasi_number column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'vehicles'
    AND column_name = 'vehicle_chasi_number'
  ) THEN
    ALTER TABLE public.vehicles
    ADD COLUMN vehicle_chasi_number text DEFAULT NULL;

    RAISE NOTICE 'Added vehicle_chasi_number column to vehicles table';
  ELSE
    RAISE NOTICE 'Column vehicle_chasi_number already exists in vehicles table';
  END IF;

  -- Add vehicle_engine_number column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'vehicles'
    AND column_name = 'vehicle_engine_number'
  ) THEN
    ALTER TABLE public.vehicles
    ADD COLUMN vehicle_engine_number text DEFAULT NULL;

    RAISE NOTICE 'Added vehicle_engine_number column to vehicles table';
  ELSE
    RAISE NOTICE 'Column vehicle_engine_number already exists in vehicles table';
  END IF;
END $$;
