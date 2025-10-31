-- Create table: compliance_documents (primary folder registry per client)
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  folder_exists BOOLEAN NOT NULL DEFAULT false,
  folder_id UUID NULL,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_compliance_documents_client ON public.compliance_documents(client_id);

-- Enable RLS
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

-- View: only rows for the user's client or backoffice admins can view all
CREATE POLICY IF NOT EXISTS "Users can view compliance documents for their client only"
ON public.compliance_documents
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    client_id IN (
      SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.backoffice_users bu WHERE bu.id = auth.uid() AND bu.is_saas_admin = true
    )
  )
);

-- Insert: only into their client (or backoffice)
CREATE POLICY IF NOT EXISTS "Users can insert compliance documents for their client"
ON public.compliance_documents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    client_id IN (
      SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.backoffice_users bu WHERE bu.id = auth.uid() AND bu.is_saas_admin = true
    )
  )
);

-- Update: only for their client (or backoffice)
CREATE POLICY IF NOT EXISTS "Users can update compliance documents for their client"
ON public.compliance_documents
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    client_id IN (
      SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.backoffice_users bu WHERE bu.id = auth.uid() AND bu.is_saas_admin = true
    )
  )
);

-- Delete: same rule
CREATE POLICY IF NOT EXISTS "Users can delete compliance documents for their client"
ON public.compliance_documents
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    client_id IN (
      SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.backoffice_users bu WHERE bu.id = auth.uid() AND bu.is_saas_admin = true
    )
  )
);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compliance_documents_updated_at ON public.compliance_documents;
CREATE TRIGGER trg_compliance_documents_updated_at
BEFORE UPDATE ON public.compliance_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();






