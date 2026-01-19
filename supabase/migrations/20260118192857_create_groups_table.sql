-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  group_type text,
  status boolean DEFAULT true NOT NULL,
  client_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT groups_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints
DO $$
BEGIN
  -- Foreign key to clients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='groups_client_id_fkey') THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key to employees table (created_by)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='groups_employee_id_fkey') THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_groups_client_id ON public.groups (client_id);
CREATE INDEX IF NOT EXISTS idx_groups_employee_id ON public.groups (employee_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups (status);

-- Add comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.groups IS 'Stores group information';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.groups.client_id IS 'Reference to the client this group belongs to';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.groups.employee_id IS 'Reference to the employee who created this group';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


