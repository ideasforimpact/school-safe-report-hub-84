-- Add reject_reason column to employee_documents table
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the employee_documents table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_documents'
  ) THEN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_documents' 
      AND column_name = 'reject_reason'
    ) THEN
ALTER TABLE employee_documents 
ADD COLUMN reject_reason TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN employee_documents.reject_reason IS 'Reason for rejecting the document verification'; 
    END IF;
  END IF;
END $$;