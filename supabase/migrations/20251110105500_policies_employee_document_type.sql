-- RLS Policies for employee_document_type table
-- Enable RLS and create policies for employee_document_type table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_document_type'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.employee_document_type ENABLE ROW LEVEL SECURITY;

    -- Policy: Authenticated users can view employee document types
    DROP POLICY IF EXISTS "Authenticated users can view employee document types" ON public.employee_document_type;
    BEGIN
      CREATE POLICY "Authenticated users can view employee document types" ON public.employee_document_type
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage employee document types
    DROP POLICY IF EXISTS "Backoffice admins can manage employee document types" ON public.employee_document_type;
    BEGIN
      CREATE POLICY "Backoffice admins can manage employee document types" ON public.employee_document_type
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

