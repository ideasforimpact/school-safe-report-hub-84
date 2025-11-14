-- Setup All Cron Jobs for Local Development
-- These cron jobs call edge functions via HTTP POST
-- Schedule: Every 1 minute (for testing purposes)
-- Local Edge Function URL: http://127.0.0.1:54321/functions/v1/{function-name}

-- IMPORTANT: Update the service role key if it changes
-- Get current key by running: supabase status
-- The key below is from the current local environment
-- If it doesn't work, update it with the current secret key from 'supabase status'

-- Clean up existing cron jobs (optional - uncomment if you want to reset)
-- SELECT cron.unschedule('process-email-queue-cron');
-- SELECT cron.unschedule('process-assessment-notifications');
-- SELECT cron.unschedule('assessment-reminders-cron');
-- SELECT cron.unschedule('process-grievance-notifications');
-- SELECT cron.unschedule('incident-reminder-cron');
-- SELECT cron.unschedule('purge-inactive-clients');
-- SELECT cron.unschedule('bank-statement-cron');

-- 1. Process Email Queue Cron
SELECT cron.schedule(
  'process-email-queue-cron',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 2. Process Assessment Notifications
SELECT cron.schedule(
  'process-assessment-notifications',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/process-assessment-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 3. Assessment Reminders Cron
SELECT cron.schedule(
  'assessment-reminders-cron',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/assessment-reminders-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 4. Process Grievance Notifications
SELECT cron.schedule(
  'process-grievance-notifications',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/process-grievance-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 5. Incident Reminder Cron
SELECT cron.schedule(
  'incident-reminder-cron',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/incident-reminder-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 6. Purge Inactive Clients
SELECT cron.schedule(
  'purge-inactive-clients',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/purge-inactive-clients',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- 7. Bank Statement Processing Cron
SELECT cron.schedule(
  'bank-statement-cron',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/bank-statement-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization', 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- View all cron jobs
SELECT 
  jobname, 
  schedule, 
  active,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
  jobid,
  command
FROM cron.job 
ORDER BY jobname;

