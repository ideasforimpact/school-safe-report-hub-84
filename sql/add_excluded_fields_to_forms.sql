-- Add excluded_fields column to custom_forms table
ALTER TABLE custom_forms 
ADD COLUMN IF NOT EXISTS excluded_fields JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN custom_forms.excluded_fields IS 'Array of field IDs that are excluded from the default grievance form fields'; 