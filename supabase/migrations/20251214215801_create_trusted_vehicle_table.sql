-- Create trusted_vehicle table
-- Stores trusted vehicle information for visitors

CREATE TABLE IF NOT EXISTS public.trusted_vehicle (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  vehicle_name text NOT NULL,
  type text NOT NULL,
  vehicle_no text NOT NULL,
  client_id uuid,
  employee_id uuid,
  name text NOT NULL,
  validity_from date NOT NULL,
  validity_to date NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trusted_vehicle_pkey'
  ) THEN
    ALTER TABLE public.trusted_vehicle ADD CONSTRAINT trusted_vehicle_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Add vehicle_no column if table exists but column is missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'trusted_vehicle'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trusted_vehicle' 
    AND column_name = 'vehicle_no'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE public.trusted_vehicle ADD COLUMN vehicle_no text;
    
    -- Update any existing rows with empty string
    UPDATE public.trusted_vehicle SET vehicle_no = '' WHERE vehicle_no IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE public.trusted_vehicle ALTER COLUMN vehicle_no SET NOT NULL;
    
    RAISE NOTICE 'Added vehicle_no column to trusted_vehicle table';
  END IF;
END $$;

-- Foreign keys (if referenced tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trusted_vehicle_client_id_fkey') THEN
    ALTER TABLE public.trusted_vehicle
      ADD CONSTRAINT trusted_vehicle_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trusted_vehicle_employee_id_fkey') THEN
    ALTER TABLE public.trusted_vehicle
      ADD CONSTRAINT trusted_vehicle_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_trusted_vehicle_client_id ON public.trusted_vehicle (client_id);
CREATE INDEX IF NOT EXISTS idx_trusted_vehicle_employee_id ON public.trusted_vehicle (employee_id);
CREATE INDEX IF NOT EXISTS idx_trusted_vehicle_vehicle_no ON public.trusted_vehicle (vehicle_no);
CREATE INDEX IF NOT EXISTS idx_trusted_vehicle_validity_from ON public.trusted_vehicle (validity_from);
CREATE INDEX IF NOT EXISTS idx_trusted_vehicle_validity_to ON public.trusted_vehicle (validity_to);
CREATE INDEX IF NOT EXISTS idx_trusted_vehicle_created_at ON public.trusted_vehicle (created_at);

-- Comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.trusted_vehicle IS 'Stores trusted vehicle information for visitors';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.vehicle_name IS 'Name or identifier of the vehicle';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.type IS 'Type of vehicle (e.g., two_wheeler, four_wheeler)';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.vehicle_no IS 'Vehicle registration number or license plate';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.client_id IS 'Reference to the client this trusted vehicle belongs to';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.employee_id IS 'Reference to the employee associated with this trusted vehicle';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.name IS 'Name of the vehicle owner or associated person';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.validity_from IS 'Start date of validity period';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.validity_to IS 'End date of validity period';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.trusted_vehicle.comments IS 'Additional comments or notes about the trusted vehicle';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

