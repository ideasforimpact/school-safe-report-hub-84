-- Check Cron Job Execution History
-- Run this in Supabase SQL Editor to see when cron jobs ran and their status

-- View recent cron job runs with job names
SELECT 
  j.jobname,
  jrd.jobid,
  jrd.runid,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  CASE 
    WHEN jrd.end_time IS NOT NULL AND jrd.start_time IS NOT NULL 
    THEN ROUND(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)) * 1000, 2) || ' ms'
    ELSE NULL
  END as duration
FROM cron.job_run_details jrd
LEFT JOIN cron.job j ON jrd.jobid = j.jobid
ORDER BY jrd.start_time DESC
LIMIT 20;

-- Check which cron jobs are currently active
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
ORDER BY jobname;

-- Count executions per job in the last hour
SELECT 
  j.jobname,
  COUNT(*) as execution_count,
  SUM(CASE WHEN jrd.status = 'succeeded' THEN 1 ELSE 0 END) as succeeded,
  SUM(CASE WHEN jrd.status = 'failed' THEN 1 ELSE 0 END) as failed,
  MAX(jrd.start_time) as last_run
FROM cron.job_run_details jrd
LEFT JOIN cron.job j ON jrd.jobid = j.jobid
WHERE jrd.start_time > NOW() - INTERVAL '1 hour'
GROUP BY j.jobname
ORDER BY execution_count DESC;

