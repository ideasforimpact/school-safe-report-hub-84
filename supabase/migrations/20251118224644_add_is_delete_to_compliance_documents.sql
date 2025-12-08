-- Add is_delete column to compliance_documents table
-- This migration adds the is_delete column with default value 0

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'compliance_documents'
  ) THEN
    -- Add is_delete column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_documents' 
      AND column_name = 'is_delete'
    ) THEN
      ALTER TABLE public.compliance_documents 
      ADD COLUMN is_delete integer DEFAULT 0 NOT NULL;
      
      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_compliance_documents_is_delete 
      ON public.compliance_documents(is_delete);
    END IF;
  END IF;
END $$;

