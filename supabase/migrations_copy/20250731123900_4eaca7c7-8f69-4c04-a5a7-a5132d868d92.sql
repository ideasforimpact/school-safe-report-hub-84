-- Drop existing global unique constraint on employee_id
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
    -- Drop existing global unique constraint on employee_id
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_id_key;

    -- Add new client-scoped composite unique constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'employees' 
      AND constraint_name = 'employees_employee_id_client_id_key'
    ) THEN
      ALTER TABLE employees ADD CONSTRAINT employees_employee_id_client_id_key 
      UNIQUE (employee_id, client_id);
    END IF;
  END IF;
END $$;