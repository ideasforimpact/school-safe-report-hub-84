-- Add created_at and updated_at columns to notification_logs table
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
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_logs' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.notification_logs
      ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

      COMMENT ON COLUMN public.notification_logs.created_at IS 'Timestamp when the notification log was created';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_logs' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.notification_logs
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

      COMMENT ON COLUMN public.notification_logs.updated_at IS 'Timestamp when the notification log was last updated';
    END IF;
  END IF;
END $$;

