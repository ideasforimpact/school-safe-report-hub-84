-- Force make vehicle year column nullable
-- This migration ensures the year column is nullable even if previous migration didn't work
-- It handles the case where the migration was marked as ran but the schema change didn't apply

-- IMPORTANT: This migration will FAIL if the column cannot be made nullable
-- This ensures the migration system doesn't mark it as complete if the change doesn't happen

DO $$
DECLARE
  v_is_nullable TEXT;
  v_alter_executed BOOLEAN := FALSE;
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'year'
  ) THEN
    RAISE EXCEPTION 'Column "year" does not exist in vehicles table';
  END IF;

  -- Get current nullable status BEFORE alteration
  SELECT is_nullable
  INTO v_is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'vehicles' 
  AND column_name = 'year';

  RAISE NOTICE 'BEFORE: year column nullable status = %', v_is_nullable;

  -- Execute the ALTER statement (PostgreSQL allows this even if already nullable)
  -- But we'll verify it actually worked
  BEGIN
    ALTER TABLE public.vehicles 
    ALTER COLUMN year DROP NOT NULL;
    
    v_alter_executed := TRUE;
    RAISE NOTICE 'ALTER TABLE statement executed';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to execute ALTER TABLE: %', SQLERRM;
  END;
  
  -- CRITICAL: Verify the change actually happened
  -- Wait a tiny bit to ensure the change is committed
  PERFORM pg_sleep(0.1);
  
  SELECT is_nullable
  INTO v_is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'vehicles' 
  AND column_name = 'year';
  
  RAISE NOTICE 'AFTER: year column nullable status = %', v_is_nullable;
  
  -- If still NOT NULL, raise an exception to fail the migration
  IF v_is_nullable = 'NO' THEN
    RAISE EXCEPTION 'CRITICAL: Migration failed - year column is still NOT NULL after ALTER TABLE. The migration will be marked as failed.';
  END IF;
  
  RAISE NOTICE 'SUCCESS: year column is now nullable';
END $$;