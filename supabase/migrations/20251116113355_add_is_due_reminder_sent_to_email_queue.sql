-- Add is_due_reminder_sent column to email_queue table
-- This column tracks whether a due reminder has been sent for assessment notifications

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'email_queue'
  ) THEN
    -- Add is_due_reminder_sent column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_queue' 
      AND column_name = 'is_due_reminder_sent'
    ) THEN
      ALTER TABLE public.email_queue 
      ADD COLUMN is_due_reminder_sent boolean DEFAULT false NOT NULL;
      
      -- Update existing rows to set default value
      UPDATE public.email_queue 
      SET is_due_reminder_sent = false 
      WHERE is_due_reminder_sent IS NULL;
    END IF;
  END IF;
END $$;

