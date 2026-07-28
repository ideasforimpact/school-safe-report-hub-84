-- Add completion_mode to assessment_templates
-- Determines whether an assessment created from this template requires
-- ANY one assignee to complete it, or ALL assignees to complete it, before
-- the assessment as a whole is considered Completed.
-- Default 'any' preserves today's behavior for existing templates, since
-- every existing assessment has exactly one assignee.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_templates'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assessment_templates' AND column_name = 'completion_mode'
    ) THEN
      ALTER TABLE public.assessment_templates
        ADD COLUMN completion_mode text DEFAULT 'any'::text NOT NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'assessment_templates_completion_mode_check'
    ) THEN
      ALTER TABLE public.assessment_templates
        ADD CONSTRAINT assessment_templates_completion_mode_check
        CHECK (completion_mode = ANY (ARRAY['any'::text, 'all'::text]));
    END IF;
  END IF;
END $$;
