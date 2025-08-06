-- Step 1: Update existing "other" document type to "manual"
UPDATE employee_document_type 
SET name = 'manual', description = 'Manual Verification'
WHERE id = 'ad7b6c23-202f-4918-870f-2cca17ab6320';

-- Step 2: Create new "other_documents" document type
INSERT INTO employee_document_type (id, name, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'other_documents', 
  'Other Documents',
  now(),
  now()
);