-- RLS Policies for assessment_templates table
-- Enable RLS and create ALL policies from migrations_copy (matching production exactly)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assessment_templates'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Users can view assessment templates from their client and global templates (from 20250630121633)
    -- Production line 3737: Policy name is truncated to "Users can view assessment templates from their client and globa"
    DROP POLICY IF EXISTS "Users can view assessment templates from their client and global templates" ON public.assessment_templates;
    DROP POLICY IF EXISTS "Users can view assessment templates from their client and globa" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can view assessment templates from their client and globa" ON public.assessment_templates
      FOR SELECT USING (((auth.uid() IS NOT NULL) AND (((client_id = public.get_current_user_client_id()) OR (client_id IS NULL)) OR (public.is_current_user_backoffice_admin() = true))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can insert assessment templates for their client
    DROP POLICY IF EXISTS "Users can insert assessment templates for their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can insert assessment templates for their client" ON public.assessment_templates
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can update assessment templates from their client
    DROP POLICY IF EXISTS "Users can update assessment templates from their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can update assessment templates from their client" ON public.assessment_templates
      FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can delete assessment templates from their client
    DROP POLICY IF EXISTS "Users can delete assessment templates from their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can delete assessment templates from their client" ON public.assessment_templates
      FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can create templates (INSERT - general)
    -- Production line 3334: Uses subquery with employees.user_id
    DROP POLICY IF EXISTS "Users can create templates" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can create templates" ON public.assessment_templates
      FOR INSERT WITH CHECK (((client_id = (SELECT employees.client_id FROM public.employees WHERE employees.user_id = auth.uid())) OR (client_id IS NULL)));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Users can create templates for their client (INSERT)
    -- Production line 3340: Uses subquery with employees.id (not user_id!)
    DROP POLICY IF EXISTS "Users can create templates for their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can create templates for their client" ON public.assessment_templates
      FOR INSERT WITH CHECK (((client_id IS NULL) OR (client_id = (SELECT employees.client_id FROM public.employees WHERE employees.id = auth.uid()))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 7: Users can delete templates (DELETE - general)
    -- Production line 3451: Uses subquery with employees.user_id
    DROP POLICY IF EXISTS "Users can delete templates" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can delete templates" ON public.assessment_templates
      FOR DELETE USING ((client_id = (SELECT employees.client_id FROM public.employees WHERE employees.user_id = auth.uid())));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 8: Users can delete templates from their client (DELETE)
    -- Production line 3457: Uses subquery with employees.id (not user_id!)
    DROP POLICY IF EXISTS "Users can delete templates from their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can delete templates from their client" ON public.assessment_templates
      FOR DELETE USING (((client_id IS NULL) OR (client_id = (SELECT employees.client_id FROM public.employees WHERE employees.id = auth.uid()))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 9: Users can update templates (UPDATE - general)
    -- Production line 3703: Uses subquery with employees.user_id
    DROP POLICY IF EXISTS "Users can update templates" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can update templates" ON public.assessment_templates
      FOR UPDATE USING ((client_id = (SELECT employees.client_id FROM public.employees WHERE employees.user_id = auth.uid())));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 10: Users can update templates from their client (UPDATE)
    -- Production line 3709: Uses subquery with employees.id (not user_id!)
    DROP POLICY IF EXISTS "Users can update templates from their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can update templates from their client" ON public.assessment_templates
      FOR UPDATE USING (((client_id IS NULL) OR (client_id = (SELECT employees.client_id FROM public.employees WHERE employees.id = auth.uid()))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 11: Users can view templates (SELECT - general)
    -- Production line 3848: Uses subquery with employees.user_id
    DROP POLICY IF EXISTS "Users can view templates" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can view templates" ON public.assessment_templates
      FOR SELECT USING (((client_id IS NULL) OR (client_id = (SELECT employees.client_id FROM public.employees WHERE employees.user_id = auth.uid()))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 12: Users can view templates from their client (SELECT)
    -- Production line 3854: Uses subquery with employees.id (not user_id!)
    DROP POLICY IF EXISTS "Users can view templates from their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can view templates from their client" ON public.assessment_templates
      FOR SELECT USING (((client_id IS NULL) OR (client_id = (SELECT employees.client_id FROM public.employees WHERE employees.id = auth.uid()))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 13: Users can view assessment templates from their client (SELECT - with full name)
    DROP POLICY IF EXISTS "Users can view assessment templates from their client" ON public.assessment_templates;
    BEGIN
      CREATE POLICY "Users can view assessment templates from their client" ON public.assessment_templates
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

