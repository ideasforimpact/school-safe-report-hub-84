-- Revert User Story #863 (multi-assignee assessments): the assessment_assignees
-- table and the completion_mode column were introduced by migrations
-- 20260713100000-20260713100005, which this migration's sibling commit removes
-- from the repo. Those CREATE/ALTER migrations already ran against deployed
-- databases, so removing the files alone does not drop the objects there —
-- this migration does that explicitly.

DROP TABLE IF EXISTS public.assessment_assignees;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessment_templates' AND column_name = 'completion_mode'
  ) THEN
    ALTER TABLE public.assessment_templates DROP CONSTRAINT IF EXISTS assessment_templates_completion_mode_check;
    ALTER TABLE public.assessment_templates DROP COLUMN completion_mode;
  END IF;
END $$;
