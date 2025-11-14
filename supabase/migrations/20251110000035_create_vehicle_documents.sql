-- Create vehicle_documents table
-- This migration creates the vehicle_documents table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicle_documents'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.vehicle_documents (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      vehicle_id uuid NOT NULL,
      documents jsonb DEFAULT '[]'::jsonb NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT vehicle_documents_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicle_documents_vehicle_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'vehicle_documents'
      ) THEN
        ALTER TABLE public.vehicle_documents 
        ADD CONSTRAINT vehicle_documents_vehicle_id_fkey 
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_vehicle_documents_vehicle_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_vehicle_documents_vehicle_id ON public.vehicle_documents USING btree (vehicle_id);
    END IF;
  END IF;
END $$;

