-- RPC wrappers for PGMQ read/delete so Edge Functions can call them safely

create or replace function public.pgmq_read(queue_name text, vt int, qty int)
returns table (msg_id bigint, message jsonb)
language sql
security definer
as $$
  select r.msg_id, r.message
  from pgmq.read(queue_name, vt, qty) as r;
$$;

create or replace function public.pgmq_delete(queue_name text, msg_id bigint)
returns void
language sql
security definer
as $$
  select pgmq.delete(queue_name, msg_id);
$$;


