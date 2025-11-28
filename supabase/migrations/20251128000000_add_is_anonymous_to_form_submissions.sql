-- Add is_anonymous column to form_submissions table
-- This column tracks whether the form was submitted anonymously (via the anonymous checkbox)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'form_submissions'
  ) THEN
    -- Add is_anonymous column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'is_anonymous'
    ) THEN
      ALTER TABLE public.form_submissions 
      ADD COLUMN is_anonymous boolean DEFAULT false NOT NULL;
      
      -- Add a comment to document the column
      COMMENT ON COLUMN public.form_submissions.is_anonymous IS 'Indicates whether the form submission was submitted anonymously via the anonymous checkbox option';
    END IF;
  END IF;
END $$;

