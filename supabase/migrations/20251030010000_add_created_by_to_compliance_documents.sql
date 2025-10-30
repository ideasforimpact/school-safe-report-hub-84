-- Add created_by column referencing employees(id) on compliance_documents
ALTER TABLE public.compliance_documents
ADD COLUMN IF NOT EXISTS created_by UUID NULL;

-- Add foreign key constraint (idempotent pattern)
DO $$ BEGIN
  ALTER TABLE public.compliance_documents
  ADD CONSTRAINT compliance_documents_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.employees(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful index for auditing/filters
CREATE INDEX IF NOT EXISTS idx_compliance_documents_created_by ON public.compliance_documents(created_by);


