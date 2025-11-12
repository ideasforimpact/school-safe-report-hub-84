-- RLS Policies for form_submissions table
-- Enable RLS and create ALL policies from migrations_copy (matching production exactly)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'form_submissions'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Users can view form submissions from their client (from 20250911120000)
    DROP POLICY IF EXISTS "Users can view form submissions from their client" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can view form submissions from their client" ON public.form_submissions
      FOR SELECT USING (
        (auth.uid() IS NOT NULL)
        AND (
          (client_id = public.get_current_user_client_id())
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can insert form submissions (from 20250911120000 - allows public)
    DROP POLICY IF EXISTS "Users can insert form submissions" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can insert form submissions" ON public.form_submissions
      FOR INSERT WITH CHECK (
        -- Public submission allowed only if the target form is active
        (
          auth.uid() IS NULL
          AND EXISTS (
            SELECT 1 FROM public.custom_forms cf
            WHERE cf.id = form_id AND cf.is_active = true
          )
        )
        OR
        -- Authenticated users can submit for their client or if backoffice admin
        (
          auth.uid() IS NOT NULL AND (
            (client_id = public.get_current_user_client_id())
            OR (public.is_current_user_backoffice_admin() = true)
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can update form submissions from their client (from 20250911120000)
    DROP POLICY IF EXISTS "Users can update form submissions from their client" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can update form submissions from their client" ON public.form_submissions
      FOR UPDATE USING (
        (auth.uid() IS NOT NULL)
        AND (
          (client_id = public.get_current_user_client_id())
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can delete form submissions from their client (from 20250911120000)
    DROP POLICY IF EXISTS "Users can delete form submissions from their client" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can delete form submissions from their client" ON public.form_submissions
      FOR DELETE USING (
        (auth.uid() IS NOT NULL)
        AND (
          (client_id = public.get_current_user_client_id())
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can view form submissions from their client (from 20250701025330 - old version)
    DROP POLICY IF EXISTS "Users can view form submissions from their client" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can view form submissions from their client" ON public.form_submissions
      FOR SELECT USING (
        (auth.uid() IS NOT NULL) AND (
          (form_id IN (SELECT id FROM custom_forms WHERE client_id = get_current_user_client_id())) 
          OR (is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Users can insert form submissions (from 20250701025330 - old version, allows anyone)
    DROP POLICY IF EXISTS "Users can insert form submissions" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can insert form submissions" ON public.form_submissions
      FOR INSERT WITH CHECK (true); -- Allow anyone to submit forms
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 7: Form owners can view submissions (from sql/setup_form_storage.sql)
    DROP POLICY IF EXISTS "Form owners can view submissions" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Form owners can view submissions" ON public.form_submissions
      FOR SELECT USING (
        form_id IN (
          SELECT id FROM custom_forms 
          WHERE client_id IN (
            SELECT client_id FROM employees WHERE user_id = auth.uid() AND status = true
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 8: Public can insert form submissions (from sql/setup_form_storage.sql)
    DROP POLICY IF EXISTS "Public can insert form submissions" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Public can insert form submissions" ON public.form_submissions
      FOR INSERT WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 9: Users can insert form submissions for their client (INSERT - specific)
    DROP POLICY IF EXISTS "Users can insert form submissions for their client" ON public.form_submissions;
    BEGIN
      CREATE POLICY "Users can insert form submissions for their client" ON public.form_submissions
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

