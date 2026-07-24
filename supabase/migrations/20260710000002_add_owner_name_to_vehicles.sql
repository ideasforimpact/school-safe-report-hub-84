-- Add dedicated (unmasked) owner name column to vehicles table
-- Mirrors vehicle_chasi_number / vehicle_engine_number: holds the real owner name fetched
-- via the vehicle-unmask edge function when the primary masked RC endpoint returns it masked.
-- This migration is idempotent and can be safely rerun.

DO $$
BEGIN
  -- Add vehicle_owner_name column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'vehicles'
    AND column_name = 'vehicle_owner_name'
  ) THEN
    ALTER TABLE public.vehicles
    ADD COLUMN vehicle_owner_name text DEFAULT NULL;

    RAISE NOTICE 'Added vehicle_owner_name column to vehicles table';
  ELSE
    RAISE NOTICE 'Column vehicle_owner_name already exists in vehicles table';
  END IF;
END $$;
