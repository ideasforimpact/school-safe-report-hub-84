-- Backfill assessment_assignees from existing single-assignee assessments
-- (AC-09: existing assessments must keep working unchanged). One row per
-- assessment that already has assigned_to set, copying its current
-- progress so it reads identically through the new assessment_assignees
-- table as it does through the legacy assessments columns.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_assignees'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    INSERT INTO public.assessment_assignees
      (assessment_id, employee_id, client_id, assigned_by, status, answers, score,
       completed_by, completed_on, closure_comments, rework_comments, created_at, updated_at)
    SELECT a.id, a.assigned_to, a.client_id, a.created_by, a.status, a.answers, a.score,
           a.completed_by, a.completed_on, a.closure_comments, a.rework_comments, a.created_at, a.updated_at
    FROM public.assessments a
    WHERE a.assigned_to IS NOT NULL AND a.client_id IS NOT NULL
    ON CONFLICT (assessment_id, employee_id) DO NOTHING;
  END IF;
END $$;
