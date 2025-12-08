-- Create visitor_kyc table
-- Stores KYC (Know Your Customer) details for visitors
-- A single visitor may have multiple KYC documents

CREATE TABLE IF NOT EXISTS public.visitor_kyc (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid,
  employee_id uuid,
  visitor_id uuid NOT NULL,
  document_type text NOT NULL,
  document_no text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visitor_kyc_pkey'
  ) THEN
    ALTER TABLE public.visitor_kyc ADD CONSTRAINT visitor_kyc_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Foreign keys (if referenced tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='visitor_kyc_client_id_fkey') THEN
    ALTER TABLE public.visitor_kyc
      ADD CONSTRAINT visitor_kyc_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='visitor_kyc_employee_id_fkey') THEN
    ALTER TABLE public.visitor_kyc
      ADD CONSTRAINT visitor_kyc_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='visitors')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='visitor_kyc_visitor_id_fkey') THEN
    ALTER TABLE public.visitor_kyc
      ADD CONSTRAINT visitor_kyc_visitor_id_fkey
      FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_visitor_kyc_visitor_id ON public.visitor_kyc (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_kyc_client_id ON public.visitor_kyc (client_id);
CREATE INDEX IF NOT EXISTS idx_visitor_kyc_employee_id ON public.visitor_kyc (employee_id);
CREATE INDEX IF NOT EXISTS idx_visitor_kyc_document_type ON public.visitor_kyc (document_type);

-- Comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.visitor_kyc IS 'Stores KYC (Know Your Customer) details for visitors. A single visitor may have multiple KYC documents.';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.visitor_kyc.visitor_id IS 'Reference to the visitor this KYC belongs to';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.visitor_kyc.client_id IS 'Reference to the client this visitor KYC belongs to';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.visitor_kyc.employee_id IS 'Reference to the employee associated with this visitor KYC';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

