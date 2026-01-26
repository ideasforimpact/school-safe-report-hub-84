-- Create employee_departments table
CREATE TABLE IF NOT EXISTS public.employee_departments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  department_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT employee_departments_pkey PRIMARY KEY (id),
  CONSTRAINT employee_departments_department_name_key UNIQUE (department_name)
);

-- Insert default departments
INSERT INTO public.employee_departments (department_name) 
VALUES 
  ('admin'),
  ('teaching'),
  ('security'),
  ('maintenance'),
  ('transport'),
  ('management')
ON CONFLICT (department_name) DO NOTHING;

-- Add new department_id column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS department_id uuid;

-- Migrate existing data from text to UUID
DO $$
DECLARE
  emp_record RECORD;
  dept_id uuid;
BEGIN
  -- Loop through all employees and update their department_id
  FOR emp_record IN SELECT id, department FROM public.employees WHERE department_id IS NULL
  LOOP
    -- Find the corresponding employee_departments id
    SELECT id INTO dept_id 
    FROM public.employee_departments 
    WHERE department_name = emp_record.department;
    
    -- If department exists, update the employee
    IF dept_id IS NOT NULL THEN
      UPDATE public.employees 
      SET department_id = dept_id 
      WHERE id = emp_record.id;
    ELSE
      -- If department doesn't exist, default to 'admin'
      SELECT id INTO dept_id 
      FROM public.employee_departments 
      WHERE department_name = 'admin';
      
      IF dept_id IS NOT NULL THEN
        UPDATE public.employees 
        SET department_id = dept_id 
        WHERE id = emp_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Make department_id NOT NULL after migration
ALTER TABLE public.employees 
ALTER COLUMN department_id SET NOT NULL;

-- Drop the old department text column
ALTER TABLE public.employees 
DROP COLUMN IF EXISTS department;

-- Rename department_id to department
ALTER TABLE public.employees 
RENAME COLUMN department_id TO department;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_department_fkey'
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_department_fkey
      FOREIGN KEY (department) REFERENCES public.employee_departments(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add index for department
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees (department);

-- Add comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.employee_departments IS 'Stores employee department definitions';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.employees.department IS 'Reference to employee_departments table';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


