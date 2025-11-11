-- Add is_due_reminder_sent column to email_queue
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
      AND column_name = 'is_due_reminder_sent'
    ) THEN
      ALTER TABLE email_queue
      ADD COLUMN is_due_reminder_sent boolean DEFAULT false;

      -- Optional: comment for clarity
      COMMENT ON COLUMN email_queue.is_due_reminder_sent IS 'Marks 5th-day assessment reminder sent; overdue uses is_remainder_send';
    END IF;
  END IF;
END $$;

