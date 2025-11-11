
-- Remove the current cron job
SELECT cron.unschedule('bank-statement-processing-dev');

-- Create a new cron job that runs every minute (this is the minimum interval for pg_cron)
SELECT cron.schedule(
  'bank-statement-processing-dev',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://ybvxkiubnnixntghojyy.supabase.co/functions/v1/bank-statement-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidnhraXVibm5peG50Z2hvanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY7ODcxMzksImV4cCI6MjA2MjM2MzEzOX0.z8KKLi5uNyE0jxUoQtoB6M5iXr2D7hfAeXm5t1piWKo"}'::jsonb,
        body:='{"trigger": "cron", "environment": "development", "interval": "25sec"}'::jsonb
    ) as request_id;
  $$
);
