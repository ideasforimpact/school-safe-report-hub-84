-- Add parent_folder_id for nested folder hierarchy
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'compliance_documents'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_documents' 
      AND column_name = 'parent_folder_id'
    ) THEN
      ALTER TABLE public.compliance_documents
      ADD COLUMN parent_folder_id UUID NULL;
    END IF;
    
    -- Self-referencing FK to row id for hierarchy
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_documents' 
      AND constraint_name = 'compliance_documents_parent_fk'
    ) THEN
      ALTER TABLE public.compliance_documents
      ADD CONSTRAINT compliance_documents_parent_fk
      FOREIGN KEY (parent_folder_id)
      REFERENCES public.compliance_documents(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Helpful index for querying by parent
CREATE INDEX IF NOT EXISTS idx_compliance_documents_parent ON public.compliance_documents(parent_folder_id);


