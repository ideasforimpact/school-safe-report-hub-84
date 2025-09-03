-- Add created_at and updated_at columns to notification_logs table
ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for clarity
COMMENT ON COLUMN public.notification_logs.created_at IS 'Timestamp when the notification log was created';
COMMENT ON COLUMN public.notification_logs.updated_at IS 'Timestamp when the notification log was last updated';


