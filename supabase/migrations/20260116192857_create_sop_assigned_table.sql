-- Create sop_assigned table
-- This migration creates the sop_assigned table for assigning SOPs to employees, clients, groups, and roles

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop_assigned'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.sop_assigned (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      sop_id uuid NOT NULL,
      employee_id uuid,
      client_id uuid,
      group_id uuid,
      role_id uuid,
      created_by uuid NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT sop_assigned_pkey PRIMARY KEY (id)
    );

    -- Add comment
    COMMENT ON TABLE public.sop_assigned IS 'Stores SOP assignments to employees, clients, groups, and roles';
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  -- FK to sop table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sop')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_assigned_sop_id_fkey') THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_sop_id_fkey
      FOREIGN KEY (sop_id) REFERENCES public.sop(id) ON DELETE CASCADE;
  END IF;

  -- FK to employees table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_assigned_employee_id_fkey') THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- FK to created_by -> employees table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_assigned_created_by_fkey') THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- FK to clients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_assigned_client_id_fkey') THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- FK to groups table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='groups')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_assigned_group_id_fkey') THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;

  -- FK to roles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='roles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_assigned_role_id_fkey') THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sop_assigned_sop_id ON public.sop_assigned (sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_assigned_employee_id ON public.sop_assigned (employee_id);
CREATE INDEX IF NOT EXISTS idx_sop_assigned_client_id ON public.sop_assigned (client_id);
CREATE INDEX IF NOT EXISTS idx_sop_assigned_group_id ON public.sop_assigned (group_id);
CREATE INDEX IF NOT EXISTS idx_sop_assigned_role_id ON public.sop_assigned (role_id);
CREATE INDEX IF NOT EXISTS idx_sop_assigned_created_by ON public.sop_assigned (created_by);

