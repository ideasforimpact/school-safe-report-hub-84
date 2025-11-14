-- Add documents_files column to employee_documents to store structured file metadata
-- The column is jsonb and defaults to an empty array for easy aggregation
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
      AND column_name = 'documents_files'
    ) THEN
      ALTER TABLE public.employee_documents
      ADD COLUMN documents_files jsonb NULL DEFAULT '[]'::jsonb;
      
      COMMENT ON COLUMN public.employee_documents.documents_files IS 'Array of file metadata objects for the document (e.g., objectPath, fileName, contentType, size, uploadedAt)';
    END IF;
  END IF;
END $$;


