-- Create client_purge_log table
-- This migration creates the client_purge_log table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_purge_log'
  ) THEN
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'client_purge_log_id_seq') THEN
      CREATE SEQUENCE IF NOT EXISTS public.client_purge_log_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
    END IF;

    CREATE TABLE IF NOT EXISTS public.client_purge_log (
      id bigint NOT NULL DEFAULT nextval('public.client_purge_log_id_seq'::regclass),
      client_id uuid NOT NULL,
      client_name text,
      started_at timestamp with time zone DEFAULT now() NOT NULL,
      finished_at timestamp with time zone,
      deleted_counts jsonb DEFAULT '{}'::jsonb,
      status text DEFAULT 'started'::text NOT NULL,
      error_message text,
      CONSTRAINT client_purge_log_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'client_purge_log_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'client_purge_log'
      ) THEN
        ALTER TABLE public.client_purge_log 
        ADD CONSTRAINT client_purge_log_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_client_purge_log_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_client_purge_log_client_id ON public.client_purge_log USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_client_purge_log_started_at' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_client_purge_log_started_at ON public.client_purge_log USING btree (started_at);
    END IF;
  END IF;
END $$;

