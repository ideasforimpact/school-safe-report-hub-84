-- Create storage bucket for assessment question files if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-question-files', 'assessment-question-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for assessment question files bucket
-- Policy for viewing files (public access)
DROP POLICY IF EXISTS "Assessment question files are publicly accessible" ON storage.objects;
CREATE POLICY "Assessment question files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assessment-question-files');

-- Policy for uploading files (authenticated users only)
DROP POLICY IF EXISTS "Users can upload assessment question files" ON storage.objects;
CREATE POLICY "Users can upload assessment question files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);

-- Policy for updating files (owner only)
DROP POLICY IF EXISTS "Users can update their own assessment question files" ON storage.objects;
CREATE POLICY "Users can update their own assessment question files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);

-- Policy for deleting files (owner only)
DROP POLICY IF EXISTS "Users can delete their own assessment question files" ON storage.objects;
CREATE POLICY "Users can delete their own assessment question files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);