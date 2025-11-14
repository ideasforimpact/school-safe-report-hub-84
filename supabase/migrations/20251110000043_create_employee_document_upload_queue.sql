-- Create queue for employee document uploads
-- This migration is conditional to avoid errors if pgmq extension is not available
DO $$
BEGIN
  -- Check if pgmq schema exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    -- Check if queue doesn't already exist (with error handling)
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM pgmq.meta 
        WHERE queue_name = 'employee_document_uploads'
      ) THEN
        PERFORM pgmq.create('employee_document_uploads');
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If meta table doesn't exist or other error, try to create queue anyway
        BEGIN
          PERFORM pgmq.create('employee_document_uploads');
        EXCEPTION
          WHEN OTHERS THEN
            -- Queue might already exist, ignore
            NULL;
        END;
    END;
  END IF;
END $$;

-- Create helper function to enqueue employee document upload jobs
-- This function can be created even if pgmq doesn't exist yet (it will fail when called)
CREATE OR REPLACE FUNCTION public.enqueue_employee_document_upload(job jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_id bigint;
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  SELECT pgmq.send('employee_document_uploads', job) INTO msg_id;
  RETURN msg_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_employee_document_upload IS 'Enqueues a job for processing employee document file uploads';

