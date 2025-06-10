
-- Create a function to check cron job status
CREATE OR REPLACE FUNCTION check_cron_status()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
) 
LANGUAGE sql
AS $$
  SELECT * FROM cron.job WHERE jobname = 'bank-statement-processing-dev';
$$;

-- Create a function to check recent cron executions
CREATE OR REPLACE FUNCTION check_recent_cron_runs(limit_count integer DEFAULT 10)
RETURNS TABLE (
  jobid bigint,
  runid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamp with time zone,
  end_time timestamp with time zone
)
LANGUAGE sql
AS $$
  SELECT * FROM cron.job_run_details 
  WHERE jobid IN (SELECT j.jobid FROM cron.job j WHERE j.jobname = 'bank-statement-processing-dev')
  ORDER BY start_time DESC 
  LIMIT limit_count;
$$;
