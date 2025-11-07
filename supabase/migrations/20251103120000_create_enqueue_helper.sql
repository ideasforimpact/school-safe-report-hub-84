-- Helper to enqueue jobs into the Supabase Queue `compliance_uploads`
-- Requires the Queues integration (pgmq) to be enabled in the project

create or replace function public.enqueue_compliance_upload(job jsonb)
returns bigint
language sql
security definer
set search_path = public, pgmq, extensions
as $$
  select pgmq.send('compliance_uploads', job);
$$;

comment on function public.enqueue_compliance_upload is 'Enqueue a job to compliance_uploads queue using pgmq.send(queue, job). Returns message id.';


