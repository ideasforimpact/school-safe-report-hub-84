-- Create employee_modules table
-- This migration creates the employee_modules table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_modules'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.employee_modules (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      employee_id uuid NOT NULL,
      module_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      level jsonb,
      CONSTRAINT employee_modules_pkey PRIMARY KEY (id),
      CONSTRAINT employee_modules_employee_id_module_id_key UNIQUE (employee_id, module_id)
    );

    -- Set replica identity
    ALTER TABLE ONLY public.employee_modules REPLICA IDENTITY FULL;

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_modules_employee_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'employee_modules'
      ) THEN
        ALTER TABLE public.employee_modules 
        ADD CONSTRAINT employee_modules_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_modules_module_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'employee_modules'
      ) THEN
        ALTER TABLE public.employee_modules 
        ADD CONSTRAINT employee_modules_module_id_fkey 
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
        
        COMMENT ON CONSTRAINT employee_modules_module_id_fkey ON public.employee_modules 
        IS 'Foreign key reference to modules table instead of roles';
      END IF;
    END IF;

    -- Add comment
    COMMENT ON TABLE public.employee_modules IS 'Stores module permissions for each employee';
  END IF;
END $$;

