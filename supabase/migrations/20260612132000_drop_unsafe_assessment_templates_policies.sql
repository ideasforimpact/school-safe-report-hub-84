-- Feature 1 + 2 follow-up: assessment_templates has THIRTEEN overlapping
-- RLS policies. Policies 5–12 (created from the production snapshot in
-- 20251110121500_policies_assessment_templates.sql) all use bare scalar
-- subqueries like
--     client_id = (SELECT client_id FROM employees WHERE user_id = auth.uid())
-- which return MULTIPLE rows when the same user_id is linked to multiple
-- employees rows across clients (the whole point of Feature 1). Postgres
-- then throws SQLSTATE 21000 ("more than one row returned by a subquery
-- used as an expression") and the entire query fails — visible as the
-- assessment_templates 500s the user is hitting on the dashboard.
--
-- The four helper-based policies (policies 1–4) plus policy 13 ("Users
-- can view assessment templates from their client") already cover the
-- full CRUD scope via the safe public.get_current_user_client_id()
-- function, so dropping the unsafe duplicates is lossless.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_templates'
  ) THEN
    -- Policy 5: SELECT-side template create scope (bare subquery, employees.user_id)
    DROP POLICY IF EXISTS "Users can create templates" ON public.assessment_templates;
    -- Policy 6: INSERT scope via employees.id = auth.uid() (always false but still 21000-able)
    DROP POLICY IF EXISTS "Users can create templates for their client" ON public.assessment_templates;
    -- Policy 7
    DROP POLICY IF EXISTS "Users can delete templates" ON public.assessment_templates;
    -- Policy 8
    DROP POLICY IF EXISTS "Users can delete templates from their client" ON public.assessment_templates;
    -- Policy 9
    DROP POLICY IF EXISTS "Users can update templates" ON public.assessment_templates;
    -- Policy 10
    DROP POLICY IF EXISTS "Users can update templates from their client" ON public.assessment_templates;
    -- Policy 11
    DROP POLICY IF EXISTS "Users can view templates" ON public.assessment_templates;
    -- Policy 12
    DROP POLICY IF EXISTS "Users can view templates from their client" ON public.assessment_templates;
  END IF;
END $$;
