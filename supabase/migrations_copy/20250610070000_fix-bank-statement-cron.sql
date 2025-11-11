
-- First, unschedule any existing cron jobs to avoid conflicts
SELECT cron.unschedule('bank-statement-processing-dev');

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a proper cron job that runs every minute
-- Note: pg_cron only supports 5-field format (minute hour day month day_of_week)
SELECT cron.schedule(
  'bank-statement-processing-dev',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://ybvxkiubnnixntghojyy.supabase.co/functions/v1/bank-statement-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidnhraXVibm5peG50Z2hvanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODcxMzksImV4cCI6MjA2MjM2MzEzOX0.z8KKLi5uNyE0jxUoQtoB6M5iXr2D7hfAeXm5t1piWKo"}'::jsonb,
        body:='{"trigger": "cron", "environment": "development"}'::jsonb
    ) as request_id;
  $$
);

-- Add some logging to track cron job execution
DO $$
BEGIN
  RAISE NOTICE 'Bank statement cron job scheduled successfully to run every minute';
END
$$;
