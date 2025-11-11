-- Add is_remainder_cron_started column to email_queue table
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the email_queue table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_queue'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_queue' 
      AND column_name = 'is_remainder_cron_started'
    ) THEN
      ALTER TABLE public.email_queue 
      ADD COLUMN is_remainder_cron_started BOOLEAN DEFAULT FALSE;

      -- Add comment for clarity
      COMMENT ON COLUMN public.email_queue.is_remainder_cron_started IS 'Flag to track if remainder cron job has been started for this email';

      -- Add index for better performance when querying by this column
      CREATE INDEX IF NOT EXISTS idx_email_queue_is_remainder_cron_started 
      ON public.email_queue (is_remainder_cron_started);
    END IF;
  END IF;
END $$; 