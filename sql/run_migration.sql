-- Run this SQL in your Supabase SQL editor to add the excluded_fields column

-- Add excluded_fields column to custom_forms table
ALTER TABLE custom_forms 
ADD COLUMN IF NOT EXISTS excluded_fields JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN custom_forms.excluded_fields IS 'Array of field IDs that are excluded from the default grievance form fields';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'custom_forms' AND column_name = 'excluded_fields'; 