-- Create storage bucket for assessment question files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-question-files', 'assessment-question-files', false);

-- Create storage policies for assessment question files
CREATE POLICY "Users can view assessment files from their client" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

CREATE POLICY "Users can upload assessment files for their client" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

CREATE POLICY "Users can update assessment files from their client" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

CREATE POLICY "Users can delete assessment files from their client" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);