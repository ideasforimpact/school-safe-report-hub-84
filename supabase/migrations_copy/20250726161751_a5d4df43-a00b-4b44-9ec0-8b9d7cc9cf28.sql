-- Clean up email data by removing trailing whitespace and newlines
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  -- Check if the employees table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
UPDATE public.employees 
SET email = TRIM(email)
WHERE email != TRIM(email);
  END IF;
END $$;