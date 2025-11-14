-- Create contributing_factors table
-- This migration creates the contributing_factors table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'contributing_factors'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.contributing_factors (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      description text,
      weight text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      client_id uuid,
      CONSTRAINT contributing_factors_pkey PRIMARY KEY (id),
      CONSTRAINT contributing_factors_weight_check CHECK (
        weight = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text])
      )
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contributing_factors_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'contributing_factors'
      ) THEN
        ALTER TABLE public.contributing_factors 
        ADD CONSTRAINT contributing_factors_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_contributing_factors_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_contributing_factors_client_id ON public.contributing_factors USING btree (client_id);
    END IF;
  END IF;
END $$;

