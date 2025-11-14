-- Create table: compliance_documents (primary folder registry per client)
-- This migration is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'compliance_documents'
  ) THEN
    CREATE TABLE public.compliance_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL,
      folder_exists BOOLEAN NOT NULL DEFAULT false,
      folder_id UUID NULL,
      files JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_compliance_documents_client ON public.compliance_documents(client_id);

-- Enable RLS
DO $$
DECLARE
  has_employees boolean;
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'compliance_documents'
  ) THEN
    ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

    -- Determine if employees table exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'employees'
    ) INTO has_employees;

    -- View: only rows for the user's client or backoffice admins can view all
    DROP POLICY IF EXISTS "Users can view compliance documents for their client only" ON public.compliance_documents;
    IF has_employees THEN
      CREATE POLICY "Users can view compliance documents for their client only"
      ON public.compliance_documents
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND (
          client_id IN (
            SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
          )
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    ELSE
      CREATE POLICY "Users can view compliance documents for their client only"
      ON public.compliance_documents
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND (public.is_current_user_backoffice_admin() = true)
      );
    END IF;

    -- Insert: only into their client (or backoffice)
    DROP POLICY IF EXISTS "Users can insert compliance documents for their client" ON public.compliance_documents;
    IF has_employees THEN
      CREATE POLICY "Users can insert compliance documents for their client"
      ON public.compliance_documents
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND (
          client_id IN (
            SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
          )
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    ELSE
      CREATE POLICY "Users can insert compliance documents for their client"
      ON public.compliance_documents
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND (public.is_current_user_backoffice_admin() = true)
      );
    END IF;

    -- Update: only for their client (or backoffice)
    DROP POLICY IF EXISTS "Users can update compliance documents for their client" ON public.compliance_documents;
    IF has_employees THEN
      CREATE POLICY "Users can update compliance documents for their client"
      ON public.compliance_documents
      FOR UPDATE
      USING (
        auth.uid() IS NOT NULL AND (
          client_id IN (
            SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
          )
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    ELSE
      CREATE POLICY "Users can update compliance documents for their client"
      ON public.compliance_documents
      FOR UPDATE
      USING (
        auth.uid() IS NOT NULL AND (public.is_current_user_backoffice_admin() = true)
      );
    END IF;

    -- Delete: same rule
    DROP POLICY IF EXISTS "Users can delete compliance documents for their client" ON public.compliance_documents;
    IF has_employees THEN
      CREATE POLICY "Users can delete compliance documents for their client"
      ON public.compliance_documents
      FOR DELETE
      USING (
        auth.uid() IS NOT NULL AND (
          client_id IN (
            SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
          )
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    ELSE
      CREATE POLICY "Users can delete compliance documents for their client"
      ON public.compliance_documents
      FOR DELETE
      USING (
        auth.uid() IS NOT NULL AND (public.is_current_user_backoffice_admin() = true)
      );
    END IF;
  END IF;
END $$;

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'compliance_documents'
  ) THEN
    DROP TRIGGER IF EXISTS trg_compliance_documents_updated_at ON public.compliance_documents;
    CREATE TRIGGER trg_compliance_documents_updated_at
    BEFORE UPDATE ON public.compliance_documents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;












