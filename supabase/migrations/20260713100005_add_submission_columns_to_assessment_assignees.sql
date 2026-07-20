-- Add the per-submission columns to assessment_assignees that already exist
-- on assessments (submit_comment, submit_attachment, closure_attachment,
-- rework_attachments, is_reworked) but were missing from the child table.
-- Needed so save/submit/complete/rework can be tracked independently per
-- assignee instead of on the shared assessments row.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_assignees'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assessment_assignees' AND column_name = 'submit_comment'
    ) THEN
      ALTER TABLE public.assessment_assignees ADD COLUMN submit_comment text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assessment_assignees' AND column_name = 'submit_attachment'
    ) THEN
      ALTER TABLE public.assessment_assignees ADD COLUMN submit_attachment jsonb;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assessment_assignees' AND column_name = 'closure_attachment'
    ) THEN
      ALTER TABLE public.assessment_assignees ADD COLUMN closure_attachment jsonb;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assessment_assignees' AND column_name = 'rework_attachments'
    ) THEN
      ALTER TABLE public.assessment_assignees ADD COLUMN rework_attachments jsonb;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assessment_assignees' AND column_name = 'is_reworked'
    ) THEN
      ALTER TABLE public.assessment_assignees ADD COLUMN is_reworked boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- Backfill: existing rows (created via the earlier single-assignee-shaped
-- backfill) should inherit their submission state from the parent
-- assessments row they were copied from, for the common single-assignee case.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_assignees'
  ) THEN
    UPDATE public.assessment_assignees aa
    SET
      submit_comment = a.submit_comment,
      submit_attachment = a.submit_attachment,
      closure_attachment = a.closure_attachment,
      rework_attachments = a.rework_attachments,
      is_reworked = a.is_reworked
    FROM public.assessments a
    WHERE aa.assessment_id = a.id
      AND aa.employee_id = a.assigned_to
      AND aa.submit_comment IS NULL
      AND aa.submit_attachment IS NULL
      AND a.submit_comment IS NOT NULL;
  END IF;
END $$;
