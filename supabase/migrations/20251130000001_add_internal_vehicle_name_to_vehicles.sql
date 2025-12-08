-- Add internal_vehicle_name column to vehicles table
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'internal_vehicle_name'
  ) THEN
    -- Add the column
    ALTER TABLE public.vehicles 
    ADD COLUMN internal_vehicle_name text;
    
    RAISE NOTICE 'Added internal_vehicle_name column to vehicles table';
  ELSE
    RAISE NOTICE 'Column internal_vehicle_name already exists in vehicles table';
  END IF;
END $$;

