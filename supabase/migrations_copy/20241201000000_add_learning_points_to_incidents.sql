-- Add learning_points column to incidents table
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the incidents table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'incidents'
  ) THEN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'incidents' 
      AND column_name = 'learning_points'
    ) THEN
      ALTER TABLE incidents 
      ADD COLUMN learning_points TEXT;
    END IF;
  END IF;
END $$;

