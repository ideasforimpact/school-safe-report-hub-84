-- Add error_log column to vehicles table
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'error_log'
  ) THEN
    -- Add the column as JSONB, nullable, with default NULL
    ALTER TABLE public.vehicles 
    ADD COLUMN error_log jsonb DEFAULT NULL;
    
    RAISE NOTICE 'Added error_log column to vehicles table (JSONB, nullable)';
  ELSE
    RAISE NOTICE 'Column error_log already exists in vehicles table';
  END IF;
END $$;

