-- RLS Policies for employee_documents table
-- Enable RLS and create policies for employee_documents table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_documents'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view employee documents from their client
    DROP POLICY IF EXISTS "Users can view employee documents from their client" ON public.employee_documents;
    BEGIN
      CREATE POLICY "Users can view employee documents from their client" ON public.employee_documents
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT employees.id FROM public.employees 
            WHERE employees.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert employee documents for their client
    DROP POLICY IF EXISTS "Users can insert employee documents for their client" ON public.employee_documents;
    BEGIN
      CREATE POLICY "Users can insert employee documents for their client" ON public.employee_documents
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT employees.id FROM public.employees 
            WHERE employees.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update employee documents from their client
    DROP POLICY IF EXISTS "Users can update employee documents from their client" ON public.employee_documents;
    BEGIN
      CREATE POLICY "Users can update employee documents from their client" ON public.employee_documents
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT employees.id FROM public.employees 
            WHERE employees.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete employee documents from their client
    DROP POLICY IF EXISTS "Users can delete employee documents from their client" ON public.employee_documents;
    BEGIN
      CREATE POLICY "Users can delete employee documents from their client" ON public.employee_documents
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT employees.id FROM public.employees 
            WHERE employees.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

