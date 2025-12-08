-- Add validity columns
ALTER TABLE compliance_documents
ADD COLUMN is_valid BOOLEAN DEFAULT FALSE;

ALTER TABLE compliance_documents
ADD COLUMN valid_date DATE NULL;

-- Add constraint to keep data consistent
ALTER TABLE compliance_documents
ADD CONSTRAINT valid_date_requires_is_valid
CHECK (
  (is_valid = TRUE AND valid_date IS NOT NULL)
  OR
  (is_valid = FALSE AND valid_date IS NULL)
);
