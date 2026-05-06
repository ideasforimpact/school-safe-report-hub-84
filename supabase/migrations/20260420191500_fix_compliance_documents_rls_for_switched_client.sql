-- Ensure compliance_documents honors switched client context
-- by using public.get_current_user_client_id() in RLS policies.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'compliance_documents'
  ) THEN
    ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view compliance documents for their client only" ON public.compliance_documents;
    CREATE POLICY "Users can view compliance documents for their client only"
      ON public.compliance_documents
      FOR SELECT
      USING (client_id = public.get_current_user_client_id());

    DROP POLICY IF EXISTS "Users can insert compliance documents for their client" ON public.compliance_documents;
    CREATE POLICY "Users can insert compliance documents for their client"
      ON public.compliance_documents
      FOR INSERT
      WITH CHECK (client_id = public.get_current_user_client_id());

    DROP POLICY IF EXISTS "Users can update compliance documents for their client" ON public.compliance_documents;
    CREATE POLICY "Users can update compliance documents for their client"
      ON public.compliance_documents
      FOR UPDATE
      USING (client_id = public.get_current_user_client_id())
      WITH CHECK (client_id = public.get_current_user_client_id());

    DROP POLICY IF EXISTS "Users can delete compliance documents for their client" ON public.compliance_documents;
    CREATE POLICY "Users can delete compliance documents for their client"
      ON public.compliance_documents
      FOR DELETE
      USING (client_id = public.get_current_user_client_id());
  END IF;
END $$;

