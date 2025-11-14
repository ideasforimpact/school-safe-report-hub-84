
-- Add Employee Verification module to the modules table for backoffice
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
    -- Check if the module doesn't already exist
    IF NOT EXISTS (
      SELECT 1 
      FROM public.modules 
      WHERE name = 'Employee Verification' 
      AND url = '/employee-verification'
    ) THEN
      INSERT INTO public.modules (id, name, url, icon, "order", level, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Employee Verification',
        '/employee-verification',
        'UserCheck',
        7,
        'backoffice',
        now(),
        now()
      );
    END IF;
  END IF;
END $$;
