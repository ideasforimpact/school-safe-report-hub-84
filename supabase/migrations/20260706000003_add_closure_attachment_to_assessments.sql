-- Add closure_attachment column for files uploaded when an assessment is
-- completed, and a dedicated storage bucket for the attachment
-- (path: {client_id}/{user_id}/{assessment_id}/{file})

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'closure_attachment'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN closure_attachment jsonb;

    RAISE NOTICE 'Added closure_attachment to assessments table';
  ELSE
    RAISE NOTICE 'closure_attachment already exists on assessments table';
  END IF;
END $$;

-- Create storage bucket for assessment closure attachments (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-closure-attachments', 'assessment-closure-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assessment-closure-attachments bucket
-- Path convention: {client_id}/{employee_id}/{assessment_id}/{file}
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DROP POLICY IF EXISTS "Assessment closure files are publicly accessible" ON storage.objects;
CREATE POLICY "Assessment closure files are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assessment-closure-attachments');

DROP POLICY IF EXISTS "Users can upload assessment closure files for their client" ON storage.objects;
CREATE POLICY "Users can upload assessment closure files for their client"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'assessment-closure-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can update assessment closure files from their client" ON storage.objects;
CREATE POLICY "Users can update assessment closure files from their client"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'assessment-closure-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can delete assessment closure files from their client" ON storage.objects;
CREATE POLICY "Users can delete assessment closure files from their client"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'assessment-closure-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);
