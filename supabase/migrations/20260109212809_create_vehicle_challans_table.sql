-- Create vehicle_challans table
-- This migration creates the vehicle_challans table for storing vehicle challan information

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicle_challans'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.vehicle_challans (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      vehicle_id uuid NOT NULL,
      latest_challan_data jsonb,
      challan_status boolean DEFAULT false NOT NULL,
      challan_status_code text,
      challan_history_log jsonb,
      provider text,
      success_api_count integer DEFAULT 0 NOT NULL,
      error_api_count integer DEFAULT 0 NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT vehicle_challans_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint to vehicles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicle_challans_vehicle_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'vehicle_challans'
      ) THEN
        ALTER TABLE public.vehicle_challans 
        ADD CONSTRAINT vehicle_challans_vehicle_id_fkey 
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create index on vehicle_id for better query performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_vehicle_challans_vehicle_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_vehicle_challans_vehicle_id ON public.vehicle_challans USING btree (vehicle_id);
    END IF;

    RAISE NOTICE 'Created vehicle_challans table';
  ELSE
    RAISE NOTICE 'vehicle_challans table already exists';
  END IF;
END $$;

