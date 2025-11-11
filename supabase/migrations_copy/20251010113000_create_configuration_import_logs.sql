-- Create a table to store configuration import logs
-- This migration is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'configuration_import_logs'
  ) THEN
    CREATE TABLE public.configuration_import_logs (
      id uuid primary key default gen_random_uuid(),
      client_id uuid not null,
      response_status text not null check (response_status in ('success','failed')),
      response_code integer not null,
      log jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
    
    -- Add FK constraint if clients table exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clients'
    ) THEN
      ALTER TABLE public.configuration_import_logs
      ADD CONSTRAINT configuration_import_logs_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Helpful index for querying by client and time
CREATE INDEX IF NOT EXISTS idx_configuration_import_logs_client_time
  ON public.configuration_import_logs (client_id, created_at desc);











