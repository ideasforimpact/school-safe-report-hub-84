-- RLS Policies for assessments table
-- Enable RLS and create ALL policies from migrations_copy (including duplicates to match production)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Users can view assessments from their client or involvement (from 20250630123411)
    -- Production line 3745: Uses subquery for assigned_to
    DROP POLICY IF EXISTS "Users can view assessments from their client or involvement" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can view assessments from their client or involvement" ON public.assessments
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id()
          OR created_by = auth.uid()
          OR assigned_to IN (SELECT employees.id FROM public.employees WHERE employees.user_id = auth.uid())
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can insert assessments for their client
    DROP POLICY IF EXISTS "Users can insert assessments for their client" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can insert assessments for their client" ON public.assessments
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can update assessments from their client involvement (from 20250630123411)
    -- Production line 3608: Uses subquery for assigned_to
    DROP POLICY IF EXISTS "Users can update assessments from their client involvement" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can update assessments from their client involvement" ON public.assessments
      FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        (
          (client_id = public.get_current_user_client_id() AND (created_by = auth.uid() OR assigned_to IN (SELECT employees.id FROM public.employees WHERE employees.user_id = auth.uid())))
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can delete assessments from their client
    DROP POLICY IF EXISTS "Users can delete assessments from their client" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can delete assessments from their client" ON public.assessments
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete assessments they created in their client
    DROP POLICY IF EXISTS "Users can delete assessments they created in their client" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can delete assessments they created in their client" ON public.assessments
      FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        (
          (client_id = public.get_current_user_client_id() AND created_by = auth.uid())
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Users can view assessments from their client or involvement (from 20250804121242 - with employees join)
    DROP POLICY IF EXISTS "Users can view assessments from their client or involvement" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can view assessments from their client or involvement" ON public.assessments
      FOR SELECT USING (
        (auth.uid() IS NOT NULL) AND (
          (client_id = get_current_user_client_id()) OR 
          (created_by = auth.uid()) OR 
          (assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())) OR
          (is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 7: Users can update assessments from their client involvement (from 20250804121242 - with employees join)
    DROP POLICY IF EXISTS "Users can update assessments from their client involvement" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can update assessments from their client involvement" ON public.assessments
      FOR UPDATE USING (
        (auth.uid() IS NOT NULL) AND (
          ((client_id = get_current_user_client_id()) AND (
            (created_by = auth.uid()) OR 
            (assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid()))
          )) OR
          (is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 8: Users can view assessments from their client
    DROP POLICY IF EXISTS "Users can view assessments from their client" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can view assessments from their client" ON public.assessments
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 9: Users can create assessments for their client
    DROP POLICY IF EXISTS "Users can create assessments for their client" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can create assessments for their client" ON public.assessments
      FOR INSERT WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 10: Users can update assessments from their client
    DROP POLICY IF EXISTS "Users can update assessments from their client" ON public.assessments;
    BEGIN
      CREATE POLICY "Users can update assessments from their client" ON public.assessments
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

