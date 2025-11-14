
-- Add rework_comments column to assessments table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'assessments' 
      AND column_name = 'rework_comments'
    ) THEN
      ALTER TABLE public.assessments 
      ADD COLUMN rework_comments text;
    END IF;
  END IF;
END $$;

-- Add comment to explain the column purpose
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'rework_comments'
  ) THEN
    COMMENT ON COLUMN public.assessments.rework_comments IS 'Stores comments provided when an assessment is reworked by an admin';
  END IF;
END $$;
