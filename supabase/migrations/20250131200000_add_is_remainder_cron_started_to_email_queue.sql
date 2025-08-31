-- Add is_remainder_cron_started column to email_queue table
ALTER TABLE public.email_queue 
ADD COLUMN IF NOT EXISTS is_remainder_cron_started BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN public.email_queue.is_remainder_cron_started IS 'Flag to track if remainder cron job has been started for this email';

-- Add index for better performance when querying by this column
CREATE INDEX IF NOT EXISTS idx_email_queue_is_remainder_cron_started 
ON public.email_queue (is_remainder_cron_started); 