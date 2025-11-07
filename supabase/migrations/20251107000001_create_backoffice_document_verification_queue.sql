-- Create queue for backoffice document verification comments
SELECT pgmq.create('backoffice_document_verification');

-- Create helper function to enqueue backoffice document verification jobs
CREATE OR REPLACE FUNCTION public.enqueue_backoffice_document_verification(job jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send('backoffice_document_verification', job) INTO msg_id;
  RETURN msg_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_backoffice_document_verification IS 'Enqueues a job for processing backoffice document verification comments';

