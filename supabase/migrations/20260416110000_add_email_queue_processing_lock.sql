-- Prevent duplicate sends caused by overlapping cron workers.
-- Introduce lightweight processing lock columns for atomic claiming.

ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS is_processing boolean NOT NULL DEFAULT false;

ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz NULL;

ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS processing_by text NULL;

CREATE INDEX IF NOT EXISTS idx_email_queue_processing_state
  ON public.email_queue (is_sent, active, is_processing, retry_count);

