-- Set up cron job to process email queue every 5 minutes
-- This requires the pg_cron extension to be enabled

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Conditionally (idempotently) create/update the cron job
DO $$
DECLARE
  has_cron boolean;
  has_net boolean;
  job_exists boolean;
BEGIN
  -- Check availability
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron'
  ) INTO has_cron;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'net'
  ) INTO has_net;

  IF NOT has_cron THEN
    -- pg_cron not available; skip scheduling
    RAISE NOTICE 'pg_cron schema not available; skipping email queue cron setup';
    RETURN;
  END IF;

  -- Determine if job already exists (pg_cron exposes cron.job table)
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue'
    ) INTO job_exists;
  EXCEPTION WHEN undefined_table THEN
    -- Older pg_cron may not have cron.job; fall back to unschedule attempt result
    job_exists := false;
  END;

  -- If job exists, unschedule first (ignore errors)
  IF job_exists THEN
    BEGIN
      PERFORM cron.unschedule('process-email-queue');
    EXCEPTION WHEN OTHERS THEN
      -- ignore
      NULL;
    END;
  END IF;

  -- Only schedule if http extension schema 'net' is available
  IF has_net THEN
    BEGIN
      PERFORM cron.schedule(
        'process-email-queue',
        '*/5 * * * *',
        'SELECT net.http_post(
          url := ''https://your-project-id.supabase.co/functions/v1/process-email-queue'',
          headers := ''{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting(''app.settings.service_role_key'', true)}'',
          body := ''{}''
        );'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to schedule process-email-queue: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'net schema not available; skipping scheduling process-email-queue';
  END IF;
END $$;

-- Grant necessary permissions (if cron schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
    GRANT USAGE ON SCHEMA cron TO postgres;
    -- Grant on tables may fail if none exist yet; wrap in try/catch
    BEGIN
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$; 