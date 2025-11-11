-- Add new columns to employee_documents table for API response tracking
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_documents') THEN
    -- Add columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employee_documents' AND column_name = 'api_response_data') THEN
      ALTER TABLE public.employee_documents 
      ADD COLUMN api_response_data JSONB DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employee_documents' AND column_name = 'api_verification_status') THEN
      ALTER TABLE public.employee_documents 
      ADD COLUMN api_verification_status TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employee_documents' AND column_name = 'api_verification_date') THEN
      ALTER TABLE public.employee_documents 
      ADD COLUMN api_verification_date TIMESTAMPTZ DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employee_documents' AND column_name = 'api_verification_method') THEN
      ALTER TABLE public.employee_documents 
      ADD COLUMN api_verification_method TEXT DEFAULT NULL;
    END IF;

    -- Add comments for clarity
    COMMENT ON COLUMN public.employee_documents.api_response_data IS 'Stores the complete API verification response data';
    COMMENT ON COLUMN public.employee_documents.api_verification_status IS 'Status of API verification: pending, completed, failed, or null';
    COMMENT ON COLUMN public.employee_documents.api_verification_date IS 'Timestamp when API verification was performed';
    COMMENT ON COLUMN public.employee_documents.api_verification_method IS 'Method used for API verification: surepass, manual, etc.';

    -- Add check constraint for api_verification_status
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_documents' 
      AND constraint_name = 'check_api_verification_status'
    ) THEN
      ALTER TABLE public.employee_documents 
      ADD CONSTRAINT check_api_verification_status 
      CHECK (api_verification_status IN ('pending', 'completed', 'failed') OR api_verification_status IS NULL);
    END IF;
  END IF;
END $$;