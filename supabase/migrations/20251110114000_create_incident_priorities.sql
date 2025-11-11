-- Create incident_priorities table
-- This migration creates the incident_priorities table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_priorities'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.incident_priorities (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      description text,
      color text,
      weight integer,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      client_id uuid,
      CONSTRAINT incident_priorities_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_priorities_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'incident_priorities'
      ) THEN
        ALTER TABLE public.incident_priorities 
        ADD CONSTRAINT incident_priorities_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_incident_priorities_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_incident_priorities_client_id ON public.incident_priorities USING btree (client_id);
    END IF;
  END IF;
END $$;

