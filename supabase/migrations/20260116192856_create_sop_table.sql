-- Create sop table
-- This migration creates the sop table for storing Standard Operating Procedures

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.sop (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      title text NOT NULL,
      category_id uuid NOT NULL,
      description text,
      status boolean DEFAULT true NOT NULL,
      procedure_steps jsonb DEFAULT '[]'::jsonb,
      important_notes text,
      client_id uuid,
      employee_id uuid,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT sop_pkey PRIMARY KEY (id)
    );

    -- Add comment
    COMMENT ON TABLE public.sop IS 'Stores Standard Operating Procedures';
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  -- FK to sop_categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sop_categories')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_category_id_fkey') THEN
    ALTER TABLE public.sop
      ADD CONSTRAINT sop_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.sop_categories(id) ON DELETE CASCADE;
  END IF;

  -- FK to clients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_client_id_fkey') THEN
    ALTER TABLE public.sop
      ADD CONSTRAINT sop_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- FK to employees table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_employee_id_fkey') THEN
    ALTER TABLE public.sop
      ADD CONSTRAINT sop_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sop_category_id ON public.sop (category_id);
CREATE INDEX IF NOT EXISTS idx_sop_status ON public.sop (status);
CREATE INDEX IF NOT EXISTS idx_sop_client_id ON public.sop (client_id);
CREATE INDEX IF NOT EXISTS idx_sop_employee_id ON public.sop (employee_id);

