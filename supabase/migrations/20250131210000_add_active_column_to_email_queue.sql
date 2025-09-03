-- Add active column to email_queue table
ALTER TABLE public.email_queue
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Add comment for clarity
COMMENT ON COLUMN public.email_queue.active IS 'Flag to control if this email queue entry is active and should be processed';

-- Add index for better performance when querying by active status
CREATE INDEX IF NOT EXISTS idx_email_queue_active
ON public.email_queue (active);

-- Update existing records to have active = true (in case there are existing records)
UPDATE public.email_queue 
SET active = TRUE 
WHERE active IS NULL; 