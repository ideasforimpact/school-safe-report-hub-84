-- Add is_due_reminder_sent column to email_queue
ALTER TABLE email_queue
ADD COLUMN IF NOT EXISTS is_due_reminder_sent boolean DEFAULT false;

-- Optional: comment for clarity
COMMENT ON COLUMN email_queue.is_due_reminder_sent IS 'Marks 5th-day assessment reminder sent; overdue uses is_remainder_send';

