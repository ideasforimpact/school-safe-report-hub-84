
-- Update the Employee Verification module URL to match the new backoffice route
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  -- Check if the modules table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'modules'
  ) THEN
    UPDATE public.modules 
    SET url = '/backoffice-employee-verification' 
    WHERE name = 'Employee Verification' AND level = 'backoffice';
  END IF;
END $$;
