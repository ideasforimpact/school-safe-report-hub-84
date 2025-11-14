-- Add active column to email_queue table
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
      AND column_name = 'active'
    ) THEN
ALTER TABLE public.email_queue
      ADD COLUMN active BOOLEAN DEFAULT TRUE;

-- Add comment for clarity
COMMENT ON COLUMN public.email_queue.active IS 'Flag to control if this email queue entry is active and should be processed';

-- Add index for better performance when querying by active status
CREATE INDEX IF NOT EXISTS idx_email_queue_active
ON public.email_queue (active);
    END IF;

-- Update existing records to have active = true (in case there are existing records)
    -- Only update if column exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_queue' 
      AND column_name = 'active'
    ) THEN
UPDATE public.email_queue 
SET active = TRUE 
WHERE active IS NULL; 
    END IF;
  END IF;
END $$; 