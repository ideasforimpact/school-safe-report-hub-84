-- Helper to enqueue jobs into the Supabase Queue `compliance_uploads`
-- Requires the Queues integration (pgmq) to be enabled in the project

create or replace function public.enqueue_compliance_upload(job jsonb)
returns bigint
language plpgsql
security definer
as $$
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  RETURN (SELECT pgmq.send('compliance_uploads', job));
END;
$$;

comment on function public.enqueue_compliance_upload is 'Enqueue a job to compliance_uploads queue using pgmq.send(queue, job). Returns message id.';


