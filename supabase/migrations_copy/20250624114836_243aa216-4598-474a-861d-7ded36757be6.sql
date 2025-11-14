
-- Add reopen column to incidents table
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
      AND column_name = 'reopen'
    ) THEN
      ALTER TABLE public.incidents 
      ADD COLUMN reopen integer NOT NULL DEFAULT 0;

      -- Add comment to explain the column purpose
      COMMENT ON COLUMN public.incidents.reopen IS 'Tracks how many times an incident has been reopened. Default 0 means never reopened.';
    END IF;
  END IF;
END $$;
