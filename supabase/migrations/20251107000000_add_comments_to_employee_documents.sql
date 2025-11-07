-- Add comments column to employee_documents to store verification comments
-- The column is jsonb and nullable by default
-- Each comment object contains: id (uuid), text, sentiment (boolean), filePaths (array)

ALTER TABLE public.employee_documents
ADD COLUMN IF NOT EXISTS comments jsonb NULL;

COMMENT ON COLUMN public.employee_documents.comments IS 'Array of comment objects for document verification. Each comment has: id (uuid), text (string), sentiment (boolean), filePaths (array of storage paths)';

