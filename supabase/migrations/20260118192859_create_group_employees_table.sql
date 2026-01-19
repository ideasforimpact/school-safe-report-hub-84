-- Create group_employees table
CREATE TABLE IF NOT EXISTS public.group_employees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  group_id uuid NOT NULL,
  employee_id uuid,
  role_id uuid,
  client_id uuid NOT NULL,
  created_by_employee_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT group_employees_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints
DO $$
BEGIN
  -- Foreign key to groups table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='groups')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_employees_group_id_fkey') THEN
    ALTER TABLE public.group_employees
      ADD CONSTRAINT group_employees_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key to employees table (member)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_employees_employee_id_fkey') THEN
    ALTER TABLE public.group_employees
      ADD CONSTRAINT group_employees_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key to employee_departments table (role)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_departments')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_employees_role_id_fkey') THEN
    ALTER TABLE public.group_employees
      ADD CONSTRAINT group_employees_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES public.employee_departments(id) ON DELETE SET NULL;
  END IF;

  -- Foreign key to clients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_employees_client_id_fkey') THEN
    ALTER TABLE public.group_employees
      ADD CONSTRAINT group_employees_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key to employees table (created_by)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_employees_created_by_employee_id_fkey') THEN
    ALTER TABLE public.group_employees
      ADD CONSTRAINT group_employees_created_by_employee_id_fkey
      FOREIGN KEY (created_by_employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_group_employees_group_id ON public.group_employees (group_id);
CREATE INDEX IF NOT EXISTS idx_group_employees_employee_id ON public.group_employees (employee_id);
CREATE INDEX IF NOT EXISTS idx_group_employees_role_id ON public.group_employees (role_id);
CREATE INDEX IF NOT EXISTS idx_group_employees_client_id ON public.group_employees (client_id);
CREATE INDEX IF NOT EXISTS idx_group_employees_created_by_employee_id ON public.group_employees (created_by_employee_id);

-- Add unique constraint to prevent duplicate employee-group assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_employees_group_id_employee_id_key'
  ) THEN
    ALTER TABLE public.group_employees
      ADD CONSTRAINT group_employees_group_id_employee_id_key
      UNIQUE (group_id, employee_id);
  END IF;
END $$;

-- Add comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.group_employees IS 'Stores employee-group relationships';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.group_employees.group_id IS 'Reference to the group';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.group_employees.employee_id IS 'Reference to the employee member (nullable)';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.group_employees.role_id IS 'Reference to the employee department/role (nullable)';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.group_employees.client_id IS 'Reference to the client';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.group_employees.created_by_employee_id IS 'Reference to the employee who created this record';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

