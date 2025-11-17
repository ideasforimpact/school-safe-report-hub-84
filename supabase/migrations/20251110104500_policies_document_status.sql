-- RLS Policies for document_status table
-- Enable RLS and create policies for document_status table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'document_status'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.document_status ENABLE ROW LEVEL SECURITY;

    -- Policy: Authenticated users can view document status
    DROP POLICY IF EXISTS "Authenticated users can view document status" ON public.document_status;
    BEGIN
      CREATE POLICY "Authenticated users can view document status" ON public.document_status
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage document status
    DROP POLICY IF EXISTS "Backoffice admins can manage document status" ON public.document_status;
    BEGIN
      CREATE POLICY "Backoffice admins can manage document status" ON public.document_status
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

