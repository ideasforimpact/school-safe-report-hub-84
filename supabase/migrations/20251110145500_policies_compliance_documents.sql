-- RLS Policies for compliance_documents table
-- Enable RLS and create policies matching production exactly
-- Production uses subquery pattern: client_id IN (SELECT e.client_id FROM employees e WHERE e.user_id = auth.uid() LIMIT 1)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'compliance_documents'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view compliance documents for their client only
    -- Production line 3765: Uses subquery with LIMIT 1
    DROP POLICY IF EXISTS "Users can view compliance documents for their client only" ON public.compliance_documents;
    BEGIN
      CREATE POLICY "Users can view compliance documents for their client only" ON public.compliance_documents
      FOR SELECT USING (((auth.uid() IS NOT NULL) AND ((client_id IN (SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1)) OR (public.is_current_user_backoffice_admin() = true))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert compliance documents for their client
    -- Production line 3497: Uses subquery with LIMIT 1
    DROP POLICY IF EXISTS "Users can insert compliance documents for their client" ON public.compliance_documents;
    BEGIN
      CREATE POLICY "Users can insert compliance documents for their client" ON public.compliance_documents
      FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((client_id IN (SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1)) OR (public.is_current_user_backoffice_admin() = true))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update compliance documents for their client
    -- Production line 3628: Uses subquery with LIMIT 1
    DROP POLICY IF EXISTS "Users can update compliance documents for their client" ON public.compliance_documents;
    BEGIN
      CREATE POLICY "Users can update compliance documents for their client" ON public.compliance_documents
      FOR UPDATE USING (((auth.uid() IS NOT NULL) AND ((client_id IN (SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1)) OR (public.is_current_user_backoffice_admin() = true))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete compliance documents for their client
    -- Production line 3370: Uses subquery with LIMIT 1
    DROP POLICY IF EXISTS "Users can delete compliance documents for their client" ON public.compliance_documents;
    BEGIN
      CREATE POLICY "Users can delete compliance documents for their client" ON public.compliance_documents
      FOR DELETE USING (((auth.uid() IS NOT NULL) AND ((client_id IN (SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1)) OR (public.is_current_user_backoffice_admin() = true))));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

