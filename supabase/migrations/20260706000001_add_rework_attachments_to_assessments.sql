-- Add rework_attachments to assessments table, to store supporting files
-- uploaded alongside rework_comments when an assessment is sent back for rework

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'rework_attachments'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN rework_attachments jsonb;

    RAISE NOTICE 'Added rework_attachments to assessments table';
  ELSE
    RAISE NOTICE 'rework_attachments already exists on assessments table';
  END IF;
END $$;
