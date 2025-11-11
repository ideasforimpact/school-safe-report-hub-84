-- Create queue for document comment operations (edit/delete)
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
        WHERE queue_name = 'document_comment_operation'
      ) THEN
        PERFORM pgmq.create('document_comment_operation');
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If meta table doesn't exist or other error, try to create queue anyway
        BEGIN
          PERFORM pgmq.create('document_comment_operation');
        EXCEPTION
          WHEN OTHERS THEN
            -- Queue might already exist, ignore
            NULL;
        END;
    END;
  END IF;
END $$;

-- Create helper function to enqueue document comment operation jobs
CREATE OR REPLACE FUNCTION public.enqueue_document_comment_operation(job jsonb)
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
  
  SELECT pgmq.send('document_comment_operation', job) INTO msg_id;
  RETURN msg_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_document_comment_operation IS 'Enqueues a job for processing document comment operations (edit/delete)';

