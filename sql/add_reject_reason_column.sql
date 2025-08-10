-- Add reject_reason column to employee_documents table
ALTER TABLE employee_documents
ADD COLUMN reject_reason TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN employee_documents.reject_reason IS 'Reason for rejecting the document verification'; 