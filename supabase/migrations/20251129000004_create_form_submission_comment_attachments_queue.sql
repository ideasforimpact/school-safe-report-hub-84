-- Create queue for processing acknowledgement comment attachments
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Check if pgmq schema exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'pgmq'
  ) THEN
    -- Try to create the queue if it doesn't already exist
    BEGIN
      -- Check if queue already exists
      IF EXISTS (
        SELECT 1
        FROM pgmq.meta
        WHERE queue_name = 'form_submission_comment_attachements'
      ) THEN
        RAISE NOTICE 'Queue form_submission_comment_attachements already exists, skipping creation';
      ELSE
        -- Create the queue
        PERFORM pgmq.create('form_submission_comment_attachements');
        RAISE NOTICE 'Queue form_submission_comment_attachements created successfully';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If meta table doesn't exist or any other error, try to create queue anyway
        BEGIN
          PERFORM pgmq.create('form_submission_comment_attachements');
          RAISE NOTICE 'Queue form_submission_comment_attachements created (fallback method)';
        EXCEPTION
          WHEN OTHERS THEN
            -- Queue might already exist or pgmq.create might not be available
            RAISE NOTICE 'Could not create queue form_submission_comment_attachements: %', SQLERRM;
        END;
    END;
  ELSE
    RAISE NOTICE 'pgmq schema does not exist, skipping queue creation';
  END IF;
END $$;

