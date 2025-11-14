
-- Add active column to modules table with default value true
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  -- Check if the modules table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'modules'
  ) THEN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'modules' 
      AND column_name = 'active'
    ) THEN
      ALTER TABLE public.modules 
      ADD COLUMN active boolean NOT NULL DEFAULT true;
    END IF;
  END IF;
END $$;
