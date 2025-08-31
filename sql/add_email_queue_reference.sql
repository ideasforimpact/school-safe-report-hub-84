-- Add email_queue_id reference column to notification_logs table
ALTER TABLE public.notification_logs 
ADD COLUMN email_queue_id UUID REFERENCES public.email_queue(id);

-- Create index for performance
CREATE INDEX idx_notification_logs_email_queue_id 
ON public.notification_logs(email_queue_id); 