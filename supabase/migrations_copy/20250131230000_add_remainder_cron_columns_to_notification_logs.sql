-- Add remainder_cron_status and remainder_cron_logs columns to notification_logs table
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the notification_logs table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_logs'
  ) THEN
    -- Add remainder_cron_status column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_logs' 
      AND column_name = 'remainder_cron_status'
    ) THEN
ALTER TABLE public.notification_logs
      ADD COLUMN remainder_cron_status BOOLEAN DEFAULT FALSE;

      COMMENT ON COLUMN public.notification_logs.remainder_cron_status IS 'Flag to track if remainder cron has been processed for this notification';
    END IF;

    -- Add remainder_cron_logs column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_logs' 
      AND column_name = 'remainder_cron_logs'
    ) THEN
ALTER TABLE public.notification_logs
      ADD COLUMN remainder_cron_logs TEXT DEFAULT NULL;

COMMENT ON COLUMN public.notification_logs.remainder_cron_logs IS 'Logs from remainder cron processing';
    END IF;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_remainder_cron_status
ON public.notification_logs (remainder_cron_status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_remainder_cron_status_false
ON public.notification_logs (remainder_cron_status) WHERE remainder_cron_status = FALSE;
  END IF;
END $$;
