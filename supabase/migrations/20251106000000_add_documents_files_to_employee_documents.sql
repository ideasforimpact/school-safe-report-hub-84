-- Add documents_files column to employee_documents to store structured file metadata
-- The column is jsonb and defaults to an empty array for easy aggregation

ALTER TABLE public.employee_documents
ADD COLUMN IF NOT EXISTS documents_files jsonb  NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.employee_documents.documents_files IS 'Array of file metadata objects for the document (e.g., objectPath, fileName, contentType, size, uploadedAt)';


