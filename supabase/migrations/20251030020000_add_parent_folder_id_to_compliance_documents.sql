-- Add parent_folder_id for nested folder hierarchy
ALTER TABLE public.compliance_documents
ADD COLUMN IF NOT EXISTS parent_folder_id UUID NULL;

-- Self-referencing FK to row id for hierarchy
DO $$ BEGIN
  ALTER TABLE public.compliance_documents
  ADD CONSTRAINT compliance_documents_parent_fk
  FOREIGN KEY (parent_folder_id)
  REFERENCES public.compliance_documents(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful index for querying by parent
CREATE INDEX IF NOT EXISTS idx_compliance_documents_parent ON public.compliance_documents(parent_folder_id);


