-- Add updated_at column to notification_logs table
ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

