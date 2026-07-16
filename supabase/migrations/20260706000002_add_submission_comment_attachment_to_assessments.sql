-- Add dedicated columns for the general (assessment-level) comment and attachment
-- captured when a user submits an assessment, and a dedicated storage bucket
-- for the attachment (path: {client_id}/{user_id}/{assessment_id}/{file})

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'submit_comment'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN submit_comment text;

    RAISE NOTICE 'Added submit_comment to assessments table';
  ELSE
    RAISE NOTICE 'submit_comment already exists on assessments table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'submit_attachment'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN submit_attachment jsonb;

    RAISE NOTICE 'Added submit_attachment to assessments table';
  ELSE
    RAISE NOTICE 'submit_attachment already exists on assessments table';
  END IF;
END $$;

-- Create storage bucket for assessment submission attachments (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-submission-attachments', 'assessment-submission-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assessment-submission-attachments bucket
-- Path convention: {client_id}/{employee_id}/{assessment_id}/{file}
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DROP POLICY IF EXISTS "Assessment submission files are publicly accessible" ON storage.objects;
CREATE POLICY "Assessment submission files are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assessment-submission-attachments');

DROP POLICY IF EXISTS "Users can upload assessment submission files for their client" ON storage.objects;
CREATE POLICY "Users can upload assessment submission files for their client"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'assessment-submission-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can update assessment submission files from their client" ON storage.objects;
CREATE POLICY "Users can update assessment submission files from their client"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'assessment-submission-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can delete assessment submission files from their client" ON storage.objects;
CREATE POLICY "Users can delete assessment submission files from their client"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'assessment-submission-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);
