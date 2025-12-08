-- Create visitors table
-- Stores visitor information for the organization

CREATE TABLE IF NOT EXISTS public.visitors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  mobile_no text NOT NULL,
  purpose text NOT NULL,
  whom_to_meet text NOT NULL,
  evidence_files jsonb DEFAULT '[]'::jsonb,
  client_id uuid,
  employee_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visitors_pkey'
  ) THEN
    ALTER TABLE public.visitors ADD CONSTRAINT visitors_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Foreign keys (if referenced tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='visitors_client_id_fkey') THEN
    ALTER TABLE public.visitors
      ADD CONSTRAINT visitors_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='visitors_employee_id_fkey') THEN
    ALTER TABLE public.visitors
      ADD CONSTRAINT visitors_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_visitors_client_id ON public.visitors (client_id);
CREATE INDEX IF NOT EXISTS idx_visitors_employee_id ON public.visitors (employee_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON public.visitors (created_at);

-- Comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.visitors IS 'Stores visitor information for the organization';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.visitors.client_id IS 'Reference to the client this visitor belongs to';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.visitors.employee_id IS 'Reference to the employee whom the visitor is meeting';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.visitors.evidence_files IS 'Array of evidence file objects stored in visitors_evidence bucket';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

