-- Create queue for document comment operations (edit/delete)
SELECT pgmq.create('document_comment_operation');

-- Create helper function to enqueue document comment operation jobs
CREATE OR REPLACE FUNCTION public.enqueue_document_comment_operation(job jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send('document_comment_operation', job) INTO msg_id;
  RETURN msg_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_document_comment_operation IS 'Enqueues a job for processing document comment operations (edit/delete)';

