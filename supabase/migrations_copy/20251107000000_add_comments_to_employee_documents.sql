-- Add comments column to employee_documents to store verification comments
-- The column is jsonb and nullable by default
-- Each comment object contains: id (uuid), text, sentiment (boolean), filePaths (array)
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
      AND column_name = 'comments'
    ) THEN
      ALTER TABLE public.employee_documents
      ADD COLUMN comments jsonb NULL;
      
      COMMENT ON COLUMN public.employee_documents.comments IS 'Array of comment objects for document verification. Each comment has: id (uuid), text (string), sentiment (boolean), filePaths (array of storage paths)';
    END IF;
  END IF;
END $$;


