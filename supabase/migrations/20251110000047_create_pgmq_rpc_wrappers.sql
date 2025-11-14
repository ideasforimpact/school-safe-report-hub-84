-- RPC wrappers for PGMQ read/delete so Edge Functions can call them safely

CREATE OR REPLACE FUNCTION public.pgmq_read(queue_name text, vt int, qty int)
RETURNS TABLE (msg_id bigint, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  RETURN QUERY
  SELECT r.msg_id, r.message
  FROM pgmq.read(queue_name, vt, qty) as r;
END;
$$;

CREATE OR REPLACE FUNCTION public.pgmq_delete(queue_name text, msg_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  PERFORM pgmq.delete(queue_name, msg_id);
END;
$$;

