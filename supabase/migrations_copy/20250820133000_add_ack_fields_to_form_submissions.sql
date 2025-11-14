-- Add acknowledged metadata to form_submissions
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_submissions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'acknowledged_by_name'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD COLUMN acknowledged_by_name TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'acknowledged_at'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD COLUMN acknowledged_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$; 