-- Add nullable phone column to employees table
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
    ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS phone text NULL;
  END IF;
END $$;

-- Optional: simple index if frequently filtered by phone
-- CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees (phone);

