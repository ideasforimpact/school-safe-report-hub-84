-- Add created_by column referencing employees(id) on compliance_documents
-- This migration is conditional to avoid errors if tables don't exist yet
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
      AND column_name = 'created_by'
    ) THEN
      ALTER TABLE public.compliance_documents
      ADD COLUMN created_by UUID NULL;
    END IF;
    
    -- Add foreign key constraint if employees table exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employees'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'compliance_documents' 
        AND constraint_name = 'compliance_documents_created_by_fkey'
      ) THEN
        ALTER TABLE public.compliance_documents
        ADD CONSTRAINT compliance_documents_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES public.employees(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- Helpful index for auditing/filters
CREATE INDEX IF NOT EXISTS idx_compliance_documents_created_by ON public.compliance_documents(created_by);


