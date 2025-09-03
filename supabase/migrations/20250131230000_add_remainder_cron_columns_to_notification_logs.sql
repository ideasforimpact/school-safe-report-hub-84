-- Add remainder_cron_status and remainder_cron_logs columns to notification_logs table
ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS remainder_cron_status BOOLEAN DEFAULT FALSE;

ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS remainder_cron_logs TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.notification_logs.remainder_cron_status IS 'Flag to track if remainder cron has been processed for this notification';
COMMENT ON COLUMN public.notification_logs.remainder_cron_logs IS 'Logs from remainder cron processing';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_remainder_cron_status
ON public.notification_logs (remainder_cron_status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_remainder_cron_status_false
ON public.notification_logs (remainder_cron_status) WHERE remainder_cron_status = FALSE;
