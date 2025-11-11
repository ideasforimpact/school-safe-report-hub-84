-- Create audit log table for client purge runs
-- Safe to run multiple times

BEGIN;

CREATE TABLE IF NOT EXISTS public.client_purge_log (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL,
  client_name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  deleted_counts JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'started', -- started | success | error
  error_message TEXT
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_client_purge_log_client_id ON public.client_purge_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_purge_log_started_at ON public.client_purge_log(started_at);

COMMIT;


