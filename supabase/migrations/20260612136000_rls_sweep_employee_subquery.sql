-- Feature 3 — sweep RLS policies that still embed the unsafe
-- `WHERE user_id = auth.uid()` subquery on employees. With multi-row
-- employees (Feature 1 + 2) these either throw PG 21000 or silently
-- return cross-client data. Each policy below is rewritten to use the
-- now-safe helpers public.get_current_user_client_id() and
-- public.get_current_user_employee_id(), which read from JWT
-- app_metadata first.
--
-- Idempotent: every CREATE POLICY is preceded by DROP POLICY IF EXISTS.

DO $$
BEGIN

  -- =========================================================================
  -- assessments
  -- 4 unsafe subqueries (id-based) in 20251110122500_policies_assessments.sql
  -- at lines 23, 50, 90, 104. Each becomes a single-value comparison against
  -- public.get_current_user_employee_id().
  -- =========================================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN

    -- Policy 1 (original at line 17) — kept SELECT semantics.
    DROP POLICY IF EXISTS "Users can view assessments from their client or involvement" ON public.assessments;
    CREATE POLICY "Users can view assessments from their client or involvement" ON public.assessments
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR created_by = auth.uid()
          OR assigned_to = public.get_current_user_employee_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    -- Policy 3 (original at line 46) — UPDATE.
    DROP POLICY IF EXISTS "Users can update assessments from their client involvement" ON public.assessments;
    CREATE POLICY "Users can update assessments from their client involvement" ON public.assessments
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          (client_id = public.get_current_user_client_id()
           AND (created_by = auth.uid()
                OR assigned_to = public.get_current_user_employee_id()))
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    -- Policies 6 and 7 are duplicates of 1 and 3 (different copy of the
    -- same policy names from migrations_copy). The DROPs above already
    -- removed them by name; no re-create needed — policies 1 and 3 above
    -- supersede.

  END IF;

  -- =========================================================================
  -- compliance_documents
  -- 4 unsafe subqueries (client_id-based with LIMIT 1) in
  -- 20251110145500_policies_compliance_documents.sql at lines 19, 27, 35, 43.
  -- =========================================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'compliance_documents'
  ) THEN

    DROP POLICY IF EXISTS "Users can view compliance documents for their client only" ON public.compliance_documents;
    CREATE POLICY "Users can view compliance documents for their client only" ON public.compliance_documents
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    DROP POLICY IF EXISTS "Users can insert compliance documents for their client" ON public.compliance_documents;
    CREATE POLICY "Users can insert compliance documents for their client" ON public.compliance_documents
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    DROP POLICY IF EXISTS "Users can update compliance documents for their client" ON public.compliance_documents;
    CREATE POLICY "Users can update compliance documents for their client" ON public.compliance_documents
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );

    DROP POLICY IF EXISTS "Users can delete compliance documents for their client" ON public.compliance_documents;
    CREATE POLICY "Users can delete compliance documents for their client" ON public.compliance_documents
      FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
  END IF;

  -- =========================================================================
  -- client_ai_features
  -- 1 unsafe subquery in 20260406120000_create_client_ai_features.sql line 66.
  -- =========================================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'client_ai_features'
  ) THEN

    DROP POLICY IF EXISTS "client_ai_features_select_tenant_or_backoffice" ON public.client_ai_features;
    CREATE POLICY "client_ai_features_select_tenant_or_backoffice" ON public.client_ai_features
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
  END IF;

END $$;
