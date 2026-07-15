-- Add is_reworked flag to assessments table. Rework comments/attachments are
-- both optional, so they can't reliably signal "this Draft is a rework" on
-- their own (both may be null even when a rework genuinely happened). This
-- dedicated flag is set true whenever an assessment is sent back for rework,
-- and cleared when the assignee resubmits it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'is_reworked'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN is_reworked boolean NOT NULL DEFAULT false;

    RAISE NOTICE 'Added is_reworked to assessments table';
  ELSE
    RAISE NOTICE 'is_reworked already exists on assessments table';
  END IF;
END $$;
