-- Make vehicle year column nullable
-- This allows vehicles to be created without a registration year

--Cheking Vehicle 
DO $$
BEGIN
  -- Check if the column exists and is currently NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'year'
    AND is_nullable = 'NO'
  ) THEN
    -- Alter the column to allow NULL
    ALTER TABLE public.vehicles 
    ALTER COLUMN year DROP NOT NULL;
    
    RAISE NOTICE 'Vehicle year column has been made nullable';
  ELSE
    RAISE NOTICE 'Vehicle year column is already nullable or does not exist';
  END IF;
END $$;

