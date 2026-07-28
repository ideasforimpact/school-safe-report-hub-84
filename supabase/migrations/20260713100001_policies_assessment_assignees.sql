-- RLS policies for assessment_assignees
-- Follows the safe helper convention established in
-- 20260612135000_jwt_first_user_client_helpers.sql /
-- 20260612136000_rls_sweep_employee_subquery.sql: policies must resolve
-- the current user's client/employee via public.get_current_user_client_id()
-- / public.get_current_user_employee_id() rather than a raw
-- "WHERE user_id = auth.uid()" subquery on employees (which breaks with
-- multi-employee-per-user accounts).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_assignees'
  ) THEN
    ALTER TABLE public.assessment_assignees ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their assessment assignee rows" ON public.assessment_assignees;
    CREATE POLICY "Users can view their assessment assignee rows" ON public.assessment_assignees
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
          employee_id = public.get_current_user_employee_id()
          OR client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_assignees.assessment_id AND a.created_by = auth.uid()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    DROP POLICY IF EXISTS "Users can insert assessment assignee rows for their client" ON public.assessment_assignees;
    CREATE POLICY "Users can insert assessment assignee rows for their client" ON public.assessment_assignees
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    DROP POLICY IF EXISTS "Users can update their assessment assignee rows" ON public.assessment_assignees;
    CREATE POLICY "Users can update their assessment assignee rows" ON public.assessment_assignees
      FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
          employee_id = public.get_current_user_employee_id()
          OR client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    DROP POLICY IF EXISTS "Users can delete assessment assignee rows for their client" ON public.assessment_assignees;
    CREATE POLICY "Users can delete assessment assignee rows for their client" ON public.assessment_assignees
      FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
  END IF;
END $$;
