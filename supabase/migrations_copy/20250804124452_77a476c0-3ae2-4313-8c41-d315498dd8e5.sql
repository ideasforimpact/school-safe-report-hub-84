-- Create RLS policies for all tables that have RLS enabled but no policies
-- This fixes the application breaking issues after enabling RLS
-- This migration is conditional to avoid errors if tables don't exist yet

DO $$
BEGIN
  -- Critical: client_modules table - controls module access
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_modules') THEN
    DROP POLICY IF EXISTS "Users can view client modules from their client" ON public.client_modules;
    CREATE POLICY "Users can view client modules from their client" 
    ON public.client_modules 
    FOR SELECT 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can insert client modules for their client" ON public.client_modules;
    CREATE POLICY "Users can insert client modules for their client" 
    ON public.client_modules 
    FOR INSERT 
    WITH CHECK ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can update client modules from their client" ON public.client_modules;
    CREATE POLICY "Users can update client modules from their client" 
    ON public.client_modules 
    FOR UPDATE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can delete client modules from their client" ON public.client_modules;
    CREATE POLICY "Users can delete client modules from their client" 
    ON public.client_modules 
    FOR DELETE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));
  END IF;

  -- Critical: campuses table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campuses') THEN
    DROP POLICY IF EXISTS "Users can view campuses from their client" ON public.campuses;
    CREATE POLICY "Users can view campuses from their client" 
    ON public.campuses 
    FOR SELECT 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can insert campuses for their client" ON public.campuses;
    CREATE POLICY "Users can insert campuses for their client" 
    ON public.campuses 
    FOR INSERT 
    WITH CHECK ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can update campuses from their client" ON public.campuses;
    CREATE POLICY "Users can update campuses from their client" 
    ON public.campuses 
    FOR UPDATE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can delete campuses from their client" ON public.campuses;
    CREATE POLICY "Users can delete campuses from their client" 
    ON public.campuses 
    FOR DELETE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));
  END IF;

  -- Critical: client_type table (global reference data)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_type') THEN
    DROP POLICY IF EXISTS "Authenticated users can view client types" ON public.client_type;
    CREATE POLICY "Authenticated users can view client types" 
    ON public.client_type 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage client types" ON public.client_type;
    CREATE POLICY "Backoffice admins can manage client types" 
    ON public.client_type 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;

  -- edusafe_resources table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edusafe_resources') THEN
    DROP POLICY IF EXISTS "Users can view edusafe resources from their client" ON public.edusafe_resources;
    CREATE POLICY "Users can view edusafe resources from their client" 
    ON public.edusafe_resources 
    FOR SELECT 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can insert edusafe resources for their client" ON public.edusafe_resources;
    CREATE POLICY "Users can insert edusafe resources for their client" 
    ON public.edusafe_resources 
    FOR INSERT 
    WITH CHECK ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can update edusafe resources from their client" ON public.edusafe_resources;
    CREATE POLICY "Users can update edusafe resources from their client" 
    ON public.edusafe_resources 
    FOR UPDATE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can delete edusafe resources from their client" ON public.edusafe_resources;
    CREATE POLICY "Users can delete edusafe resources from their client" 
    ON public.edusafe_resources 
    FOR DELETE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));
  END IF;

  -- employee_documents table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_documents') THEN
    DROP POLICY IF EXISTS "Users can view employee documents from their client" ON public.employee_documents;
    CREATE POLICY "Users can view employee documents from their client" 
    ON public.employee_documents 
    FOR SELECT 
    USING ((auth.uid() IS NOT NULL) AND ((employee_id IN (SELECT id FROM employees WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can insert employee documents for their client" ON public.employee_documents;
    CREATE POLICY "Users can insert employee documents for their client" 
    ON public.employee_documents 
    FOR INSERT 
    WITH CHECK ((auth.uid() IS NOT NULL) AND ((employee_id IN (SELECT id FROM employees WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can update employee documents from their client" ON public.employee_documents;
    CREATE POLICY "Users can update employee documents from their client" 
    ON public.employee_documents 
    FOR UPDATE 
    USING ((auth.uid() IS NOT NULL) AND ((employee_id IN (SELECT id FROM employees WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can delete employee documents from their client" ON public.employee_documents;
    CREATE POLICY "Users can delete employee documents from their client" 
    ON public.employee_documents 
    FOR DELETE 
    USING ((auth.uid() IS NOT NULL) AND ((employee_id IN (SELECT id FROM employees WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));
  END IF;

  -- form_submissions table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'form_submissions') THEN
    DROP POLICY IF EXISTS "Users can view form submissions from their client" ON public.form_submissions;
    CREATE POLICY "Users can view form submissions from their client" 
    ON public.form_submissions 
    FOR SELECT 
    USING ((auth.uid() IS NOT NULL) AND ((form_id IN (SELECT id FROM custom_forms WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can insert form submissions" ON public.form_submissions;
    CREATE POLICY "Users can insert form submissions" 
    ON public.form_submissions 
    FOR INSERT 
    WITH CHECK (true); -- Allow anyone to submit forms

    DROP POLICY IF EXISTS "Users can update form submissions from their client" ON public.form_submissions;
    CREATE POLICY "Users can update form submissions from their client" 
    ON public.form_submissions 
    FOR UPDATE 
    USING ((auth.uid() IS NOT NULL) AND ((form_id IN (SELECT id FROM custom_forms WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can delete form submissions from their client" ON public.form_submissions;
    CREATE POLICY "Users can delete form submissions from their client" 
    ON public.form_submissions 
    FOR DELETE 
    USING ((auth.uid() IS NOT NULL) AND ((form_id IN (SELECT id FROM custom_forms WHERE client_id = get_current_user_client_id())) OR (is_current_user_backoffice_admin() = true)));
  END IF;

  -- sections table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sections') THEN
    DROP POLICY IF EXISTS "Users can view sections from their client" ON public.sections;
    CREATE POLICY "Users can view sections from their client" 
    ON public.sections 
    FOR SELECT 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can insert sections for their client" ON public.sections;
    CREATE POLICY "Users can insert sections for their client" 
    ON public.sections 
    FOR INSERT 
    WITH CHECK ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can update sections from their client" ON public.sections;
    CREATE POLICY "Users can update sections from their client" 
    ON public.sections 
    FOR UPDATE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));

    DROP POLICY IF EXISTS "Users can delete sections from their client" ON public.sections;
    CREATE POLICY "Users can delete sections from their client" 
    ON public.sections 
    FOR DELETE 
    USING ((auth.uid() IS NOT NULL) AND ((client_id = get_current_user_client_id()) OR (is_current_user_backoffice_admin() = true)));
  END IF;

  -- Global reference tables - allow read access for authenticated users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_status') THEN
    DROP POLICY IF EXISTS "Authenticated users can view document status" ON public.document_status;
    CREATE POLICY "Authenticated users can view document status" 
    ON public.document_status 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage document status" ON public.document_status;
    CREATE POLICY "Backoffice admins can manage document status" 
    ON public.document_status 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_document_type') THEN
    DROP POLICY IF EXISTS "Authenticated users can view employee document types" ON public.employee_document_type;
    CREATE POLICY "Authenticated users can view employee document types" 
    ON public.employee_document_type 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage employee document types" ON public.employee_document_type;
    CREATE POLICY "Backoffice admins can manage employee document types" 
    ON public.employee_document_type 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'form_fields_type') THEN
    DROP POLICY IF EXISTS "Authenticated users can view form field types" ON public.form_fields_type;
    CREATE POLICY "Authenticated users can view form field types" 
    ON public.form_fields_type 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage form field types" ON public.form_fields_type;
    CREATE POLICY "Backoffice admins can manage form field types" 
    ON public.form_fields_type 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incident_status') THEN
    DROP POLICY IF EXISTS "Authenticated users can view incident status" ON public.incident_status;
    CREATE POLICY "Authenticated users can view incident status" 
    ON public.incident_status 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage incident status" ON public.incident_status;
    CREATE POLICY "Backoffice admins can manage incident status" 
    ON public.incident_status 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
    CREATE POLICY "Authenticated users can view roles" 
    ON public.roles 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage roles" ON public.roles;
    CREATE POLICY "Backoffice admins can manage roles" 
    ON public.roles 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;

  -- backoffice_edusafe_resource table - only for backoffice admins
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backoffice_edusafe_resource') THEN
    DROP POLICY IF EXISTS "Backoffice admins can manage backoffice edusafe resources" ON public.backoffice_edusafe_resource;
    CREATE POLICY "Backoffice admins can manage backoffice edusafe resources" 
    ON public.backoffice_edusafe_resource 
    FOR ALL 
    USING (is_current_user_backoffice_admin() = true)
    WITH CHECK (is_current_user_backoffice_admin() = true);
  END IF;
END $$;
