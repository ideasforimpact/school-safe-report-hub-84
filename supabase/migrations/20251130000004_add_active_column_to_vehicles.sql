-- Add active column to vehicles table
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'active'
  ) THEN
    -- Add the column with default value true
    ALTER TABLE public.vehicles 
    ADD COLUMN active boolean DEFAULT true NOT NULL;
    
    RAISE NOTICE 'Added active column to vehicles table with default value true';
  ELSE
    RAISE NOTICE 'Column active already exists in vehicles table';
  END IF;
END $$;

