-- Enable the pg_cron extension first (with error handling for permission issues)
-- In Supabase production, extensions may already be enabled or require admin privileges
DO $$
BEGIN
  -- Try to create pg_cron extension
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Extension might already exist or require admin privileges
    -- Check if it exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
      RAISE NOTICE 'pg_cron extension not found and cannot be created due to insufficient privileges. Please enable it through Supabase dashboard.';
    END IF;
  WHEN OTHERS THEN
    -- Other errors - log but don't fail
    RAISE NOTICE 'Error creating pg_cron extension: %', SQLERRM;
END $$;

-- Enable the pg_net extension for HTTP requests (with error handling)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Extension might already exist or require admin privileges
    IF NOT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) THEN
      RAISE NOTICE 'pg_net extension not found and cannot be created due to insufficient privileges. Please enable it through Supabase dashboard.';
    END IF;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating pg_net extension: %', SQLERRM;
END $$;

-- Now create the cron job that runs every 25 seconds for development
-- Only schedule if pg_cron extension exists and cron schema is available
DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron'
  ) THEN
    -- Unschedule existing job if it exists
    BEGIN
      PERFORM cron.unschedule('bank-statement-processing-dev');
    EXCEPTION
      WHEN OTHERS THEN
        -- Job doesn't exist, continue
        NULL;
    END;
    
    -- Schedule the cron job
    PERFORM cron.schedule(
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
    RAISE NOTICE 'Bank statement cron job scheduled successfully to run every 25 seconds';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Skipping cron job scheduling.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error scheduling cron job: %', SQLERRM;
END $$;
