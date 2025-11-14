-- Create configuration_import_logs table
-- This migration creates the configuration_import_logs table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'configuration_import_logs'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.configuration_import_logs (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      response_status text NOT NULL,
      response_code integer NOT NULL,
      log jsonb DEFAULT '{}'::jsonb NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT configuration_import_logs_pkey PRIMARY KEY (id),
      CONSTRAINT configuration_import_logs_response_status_check CHECK (
        response_status = ANY (ARRAY['success'::text, 'failed'::text])
      )
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'configuration_import_logs_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'configuration_import_logs'
      ) THEN
        ALTER TABLE public.configuration_import_logs 
        ADD CONSTRAINT configuration_import_logs_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_configuration_import_logs_client_time' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_configuration_import_logs_client_time 
      ON public.configuration_import_logs (client_id, created_at DESC);
    END IF;
  END IF;
END $$;

