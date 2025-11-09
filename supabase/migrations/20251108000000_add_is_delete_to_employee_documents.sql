-- Add is_delete column to employee_documents table
-- Default value is 0 to indicate the document is not deleted
ALTER TABLE public.employee_documents
ADD COLUMN IF NOT EXISTS is_delete INTEGER DEFAULT 0;

-- Add comment to describe the column
COMMENT ON COLUMN public.employee_documents.is_delete IS 'Soft delete flag: 0 = not deleted, 1 = deleted';

