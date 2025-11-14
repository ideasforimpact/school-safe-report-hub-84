-- Create employees table (idempotent)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  employee_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  employee_type text NOT NULL,
  department text NOT NULL,
  joining_date text NOT NULL,
  status boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  client_id uuid,
  is_super_admin boolean DEFAULT false NOT NULL,
  phone text,
  designation text
);

-- PK and uniques
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_pkey'
  ) THEN
    ALTER TABLE public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_employee_id_client_id_key'
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_employee_id_client_id_key
      UNIQUE (employee_id, client_id);
  END IF;
END $$;

-- FKs (if referenced tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='employees_client_id_fkey') THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_employees_client_id ON public.employees (client_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees (user_id);

-- Comment (optional)
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.employees IS 'Stores employee information for the organization';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.employees.client_id IS 'Reference to the client this employee belongs to';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


