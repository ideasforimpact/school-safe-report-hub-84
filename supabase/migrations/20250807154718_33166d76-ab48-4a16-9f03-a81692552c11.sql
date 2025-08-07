-- Add new columns to employee_documents table for API response tracking
ALTER TABLE public.employee_documents 
ADD COLUMN IF NOT EXISTS api_response_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_verification_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_verification_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_verification_method TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.employee_documents.api_response_data IS 'Stores the complete API verification response data';
COMMENT ON COLUMN public.employee_documents.api_verification_status IS 'Status of API verification: pending, completed, failed, or null';
COMMENT ON COLUMN public.employee_documents.api_verification_date IS 'Timestamp when API verification was performed';
COMMENT ON COLUMN public.employee_documents.api_verification_method IS 'Method used for API verification: surepass, manual, etc.';

-- Add check constraint for api_verification_status
ALTER TABLE public.employee_documents 
ADD CONSTRAINT check_api_verification_status 
CHECK (api_verification_status IN ('pending', 'completed', 'failed') OR api_verification_status IS NULL);