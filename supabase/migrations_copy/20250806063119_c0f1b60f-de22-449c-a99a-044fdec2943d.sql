-- Step 1: Update existing "other" document type to "manual"
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  -- Check if the employee_document_type table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_document_type'
  ) THEN
    -- Update existing "other" document type to "manual"
    UPDATE employee_document_type 
    SET name = 'manual', description = 'Manual Verification'
    WHERE id = 'ad7b6c23-202f-4918-870f-2cca17ab6320';

    -- Step 2: Create new "other_documents" document type if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM employee_document_type 
      WHERE name = 'other_documents'
    ) THEN
      INSERT INTO employee_document_type (id, name, description, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'other_documents', 
        'Other Documents',
        now(),
        now()
      );
    END IF;
  END IF;
END $$;