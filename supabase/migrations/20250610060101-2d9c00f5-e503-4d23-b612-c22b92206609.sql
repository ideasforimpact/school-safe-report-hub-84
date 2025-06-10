
-- Enable the pg_cron extension first
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Now create the cron job that runs every 25 seconds for development
SELECT cron.schedule(
  'bank-statement-processing-dev',
  '*/25 * * * * *', -- Every 25 seconds (note the 6-field format with seconds)
  $$
  SELECT
    net.http_post(
        url:='https://ybvxkiubnnixntghojyy.supabase.co/functions/v1/bank-statement-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidnhraXVibm5peG50Z2hvanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODcxMzksImV4cCI6MjA2MjM2MzEzOX0.z8KKLi5uNyE0jxUoQtoB6M5iXr2D7hfAeXm5t1piWKo"}'::jsonb,
        body:='{"trigger": "cron", "environment": "development"}'::jsonb
    ) as request_id;
  $$
);
