-- Ensure vehicle year column is nullable
-- This is a follow-up migration to ensure the year column is actually nullable
-- Previous migration may have been marked as applied but didn't actually change the schema

-- This migration will FAIL if it cannot make the column nullable
-- This ensures proper error reporting if there are constraints preventing the change

DO $$
DECLARE
  v_is_nullable TEXT;
BEGIN
  -- Verify table and column exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'year'
  ) THEN
    RAISE EXCEPTION 'Column "year" does not exist in vehicles table';
  END IF;

  -- Check current status
  SELECT is_nullable
  INTO v_is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'vehicles' 
  AND column_name = 'year';

  -- If already nullable, we're done
  IF v_is_nullable = 'YES' THEN
    RAISE NOTICE 'Year column is already nullable - no action needed';
    RETURN;
  END IF;

  -- Execute ALTER TABLE
  RAISE NOTICE 'Making year column nullable...';
  ALTER TABLE public.vehicles 
  ALTER COLUMN year DROP NOT NULL;
  
  -- Verify the change
  SELECT is_nullable
  INTO v_is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'vehicles' 
  AND column_name = 'year';
  
  -- Fail migration if change didn't work
  IF v_is_nullable != 'YES' THEN
    RAISE EXCEPTION 'FAILED: year column is still NOT NULL after ALTER TABLE. Migration will be marked as failed.';
  END IF;
  
  RAISE NOTICE 'SUCCESS: year column is now nullable';
END $$;



