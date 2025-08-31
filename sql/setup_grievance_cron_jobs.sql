-- Setup Grievance Notification Cron Jobs
-- Replace 'your-project-id' with your actual Supabase project ID

-- 1. Process grievance notifications every 5 minutes
SELECT cron.schedule(
  'process-grievance-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/process-grievance-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 2. Weekly cleanup of sent grievance emails (older than 30 days)
SELECT cron.schedule(
  'cleanup-grievance-email-queue',
  '0 2 * * 0',
  $$
  DELETE FROM email_queue 
  WHERE module_name = 'grievance' 
    AND is_sent = true 
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);

-- 3. Weekly cleanup of old grievance notification logs (older than 90 days)
SELECT cron.schedule(
  'cleanup-grievance-notification-logs',
  '0 3 * * 0',
  $$
  DELETE FROM notification_logs 
  WHERE module = 'grievance' 
    AND created_at < NOW() - INTERVAL '90 days';
  $$
);

-- View all grievance-related cron jobs
SELECT jobname, schedule, active, jobid 
FROM cron.job 
WHERE jobname LIKE '%grievance%'
ORDER BY jobname; 