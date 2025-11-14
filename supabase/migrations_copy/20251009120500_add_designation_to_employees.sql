-- Add nullable designation column to employees table
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
ADD COLUMN IF NOT EXISTS designation text NULL;
  END IF;
END $$;


