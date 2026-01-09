-- Create client_integration table
-- This migration creates the client_integration table for managing client integrations

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_integration'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.client_integration (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      target_client_id uuid DEFAULT NULL,
      target_client_name text DEFAULT NULL,
      is_linked boolean DEFAULT false NOT NULL,
      active boolean DEFAULT false NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_by uuid DEFAULT NULL,
      CONSTRAINT client_integration_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint for client_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'client_integration_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'client_integration'
      ) THEN
        ALTER TABLE public.client_integration 
        ADD CONSTRAINT client_integration_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_client_integration_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_client_integration_client_id ON public.client_integration USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_client_integration_target_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_client_integration_target_client_id ON public.client_integration USING btree (target_client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_client_integration_is_linked' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_client_integration_is_linked ON public.client_integration USING btree (is_linked);
    END IF;

    -- Add comment
    COMMENT ON TABLE public.client_integration IS 'Stores client integration connections and linking information';
    COMMENT ON COLUMN public.client_integration.client_id IS 'Foreign key reference to the client table';
    COMMENT ON COLUMN public.client_integration.target_client_id IS 'UUID of the target client being linked';
    COMMENT ON COLUMN public.client_integration.target_client_name IS 'Name of the target client';
    COMMENT ON COLUMN public.client_integration.is_linked IS 'Indicates if the client is linked to a target client';
    COMMENT ON COLUMN public.client_integration.active IS 'Indicates if the integration is active';
    COMMENT ON COLUMN public.client_integration.updated_by IS 'UUID of the user who last updated the record';
  END IF;
END $$;






