-- Create queue for employee document uploads
SELECT pgmq.create('employee_document_uploads');

-- Create helper function to enqueue employee document upload jobs
CREATE OR REPLACE FUNCTION public.enqueue_employee_document_upload(job jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send('employee_document_uploads', job) INTO msg_id;
  RETURN msg_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_employee_document_upload IS 'Enqueues a job for processing employee document file uploads';

