-- Create vehicles table
-- This migration creates the vehicles table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicles'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.vehicles (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      registration_number text NOT NULL,
      type text NOT NULL,
      make text NOT NULL,
      model text NOT NULL,
      year integer NOT NULL,
      driver text NOT NULL,
      route text,
      capacity integer,
      status text DEFAULT 'active'::text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      client_id uuid,
      verification_status text,
      verification_date timestamp with time zone,
      verification_data jsonb,
      employee_id uuid,
      CONSTRAINT vehicles_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicles_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'vehicles'
      ) THEN
        ALTER TABLE public.vehicles 
        ADD CONSTRAINT vehicles_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicles_employee_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'vehicles'
      ) THEN
        ALTER TABLE public.vehicles 
        ADD CONSTRAINT vehicles_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_vehicles_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_vehicles_client_id ON public.vehicles USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_vehicles_employee_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_vehicles_employee_id ON public.vehicles USING btree (employee_id);
    END IF;
  END IF;
END $$;

