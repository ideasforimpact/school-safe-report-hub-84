-- Create employee_type table
CREATE TABLE IF NOT EXISTS public.employee_type (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  type_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT employee_type_pkey PRIMARY KEY (id),
  CONSTRAINT employee_type_type_name_key UNIQUE (type_name)
);

-- Insert default employee types
INSERT INTO public.employee_type (type_name) 
VALUES 
  ('permanent'),
  ('contract'),
  ('consultant'),
  ('part_time')
ON CONFLICT (type_name) DO NOTHING;

-- Add new employee_type_id column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS employee_type_id uuid;

-- Migrate existing data from text to UUID
DO $$
DECLARE
  emp_record RECORD;
  type_id uuid;
BEGIN
  -- Loop through all employees and update their employee_type_id
  FOR emp_record IN SELECT id, employee_type FROM public.employees WHERE employee_type_id IS NULL
  LOOP
    -- Find the corresponding employee_type id
    SELECT id INTO type_id 
    FROM public.employee_type 
    WHERE type_name = emp_record.employee_type;
    
    -- If type exists, update the employee
    IF type_id IS NOT NULL THEN
      UPDATE public.employees 
      SET employee_type_id = type_id 
      WHERE id = emp_record.id;
    ELSE
      -- If type doesn't exist, default to 'permanent'
      SELECT id INTO type_id 
      FROM public.employee_type 
      WHERE type_name = 'permanent';
      
      IF type_id IS NOT NULL THEN
        UPDATE public.employees 
        SET employee_type_id = type_id 
        WHERE id = emp_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Make employee_type_id NOT NULL after migration
ALTER TABLE public.employees 
ALTER COLUMN employee_type_id SET NOT NULL;

-- Drop the old employee_type text column
ALTER TABLE public.employees 
DROP COLUMN IF EXISTS employee_type;

-- Rename employee_type_id to employee_type
ALTER TABLE public.employees 
RENAME COLUMN employee_type_id TO employee_type;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_employee_type_fkey'
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_employee_type_fkey
      FOREIGN KEY (employee_type) REFERENCES public.employee_type(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add index for employee_type
CREATE INDEX IF NOT EXISTS idx_employees_employee_type ON public.employees (employee_type);

-- Add comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.employee_type IS 'Stores employee type definitions';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.employees.employee_type IS 'Reference to employee_type table';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;



