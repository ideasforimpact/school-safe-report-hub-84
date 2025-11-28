-- Disable effective RLS restrictions for form_submission_comment_attachements bucket
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Ensure storage.objects exists before touching policies
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    -- Drop existing policy if it exists (idempotent)
    DROP POLICY IF EXISTS "Public access for form_submission_comment_attachements" ON storage.objects;
    
    -- Create policy to allow public read/write for this specific bucket
    CREATE POLICY "Public access for form_submission_comment_attachements"
    ON storage.objects
    FOR ALL
    TO public
    USING (bucket_id = 'form_submission_comment_attachements')
    WITH CHECK (bucket_id = 'form_submission_comment_attachements');
    
    RAISE NOTICE 'RLS policy created/updated for form_submission_comment_attachements bucket';
  ELSE
    RAISE NOTICE 'storage.objects table does not exist, skipping RLS policy creation';
  END IF;
END $$;

