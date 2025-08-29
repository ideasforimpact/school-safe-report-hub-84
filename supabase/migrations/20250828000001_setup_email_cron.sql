-- Set up cron job to process email queue every 5 minutes
-- This requires the pg_cron extension to be enabled

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing email processing cron jobs
SELECT cron.unschedule('process-email-queue');

-- Schedule the email queue processing to run every 5 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT net.http_post(
    url := ''https://your-project-id.supabase.co/functions/v1/process-email-queue'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting(''app.settings.service_role_key'')}'',
    body := ''{}''
  );'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres; 