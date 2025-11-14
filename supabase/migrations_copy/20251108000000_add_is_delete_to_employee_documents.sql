-- Add is_delete column to employee_documents table
-- Default value is 0 to indicate the document is not deleted
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_documents'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_documents' 
      AND column_name = 'is_delete'
    ) THEN
      ALTER TABLE public.employee_documents
      ADD COLUMN is_delete INTEGER DEFAULT 0;
      
      COMMENT ON COLUMN public.employee_documents.is_delete IS 'Soft delete flag: 0 = not deleted, 1 = deleted';
    END IF;
  END IF;
END $$;

