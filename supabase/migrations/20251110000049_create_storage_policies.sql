-- Create storage policies for ALL buckets matching production
-- This migration creates all storage policies from screenshots
-- All policies are applied to 'public' role (default in Supabase storage)

-- Ensure storage schema exists and RLS is enabled
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- RLS might already be enabled, ignore error
  NULL;
END $$;

-- ============================================
-- Policies for employee_other_type_statement bucket (4 policies)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access to employee_other_type_statement" ON storage.objects;
CREATE POLICY "Allow public read access to employee_other_type_statement" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'employee_other_type_statement');

DROP POLICY IF EXISTS "Allow public upload to employee_other_type_statement" ON storage.objects;
CREATE POLICY "Allow public upload to employee_other_type_statement" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'employee_other_type_statement');

DROP POLICY IF EXISTS "Allow public update to employee_other_type_statement" ON storage.objects;
CREATE POLICY "Allow public update to employee_other_type_statement" 
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'employee_other_type_statement');

DROP POLICY IF EXISTS "Allow public delete from employee_other_type_statement" ON storage.objects;
CREATE POLICY "Allow public delete from employee_other_type_statement" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'employee_other_type_statement');

-- ============================================
-- Policies for assessment-question-files bucket (8 policies)
-- ============================================
DROP POLICY IF EXISTS "Assessment question files are publicly accessible" ON storage.objects;
CREATE POLICY "Assessment question files are publicly accessible" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'assessment-question-files');

DROP POLICY IF EXISTS "Users can view assessment files from their client" ON storage.objects;
CREATE POLICY "Users can view assessment files from their client" 
ON storage.objects 
FOR SELECT 
TO public
USING (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can upload assessment question files" ON storage.objects;
CREATE POLICY "Users can upload assessment question files" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload assessment files for their client" ON storage.objects;
CREATE POLICY "Users can upload assessment files for their client" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can update their own assessment question files" ON storage.objects;
CREATE POLICY "Users can update their own assessment question files" 
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update assessment files from their client" ON storage.objects;
CREATE POLICY "Users can update assessment files from their client" 
ON storage.objects 
FOR UPDATE 
TO public
USING (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

DROP POLICY IF EXISTS "Users can delete their own assessment question files" ON storage.objects;
CREATE POLICY "Users can delete their own assessment question files" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete assessment files from their client" ON storage.objects;
CREATE POLICY "Users can delete assessment files from their client" 
ON storage.objects 
FOR DELETE 
TO public
USING (
  bucket_id = 'assessment-question-files' 
  AND auth.uid() IS NOT NULL 
  AND (
    (storage.foldername(name))[1]::uuid = get_current_user_client_id()
    OR is_current_user_backoffice_admin() = true
  )
);

-- ============================================
-- Policies for employee_other_documents bucket (4 policies)
-- ============================================
DROP POLICY IF EXISTS "Allow public access to other documents" ON storage.objects;
CREATE POLICY "Allow public access to other documents"
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'employee_other_documents');

DROP POLICY IF EXISTS "Allow authenticated uploads to other documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to other documents"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'employee_other_documents');

DROP POLICY IF EXISTS "Allow authenticated updates to other documents" ON storage.objects;
CREATE POLICY "Allow authenticated updates to other documents"
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'employee_other_documents');

DROP POLICY IF EXISTS "Allow authenticated deletes of other documents" ON storage.objects;
CREATE POLICY "Allow authenticated deletes of other documents"
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'employee_other_documents');

-- ============================================
-- Policies for form-attachments bucket (2 policies)
-- ============================================
DROP POLICY IF EXISTS "Public access to form attachments" ON storage.objects;
CREATE POLICY "Public access to form attachments" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'form-attachments');

DROP POLICY IF EXISTS "Authenticated users can upload form attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload form attachments" 
ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'form-attachments');

-- ============================================
-- Policies for compliance_documents bucket (2 policies)
-- ============================================
DROP POLICY IF EXISTS "Authenticated can read compliance docs" ON storage.objects;
CREATE POLICY "Authenticated can read compliance docs" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'compliance_documents');

DROP POLICY IF EXISTS "Authenticated can upload compliance docs" ON storage.objects;
CREATE POLICY "Authenticated can upload compliance docs" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'compliance_documents');

-- ============================================
-- Policies for incident-documents bucket (1 policy)
-- ============================================
DROP POLICY IF EXISTS "Public Access for incident-documents" ON storage.objects;
CREATE POLICY "Public Access for incident-documents" 
ON storage.objects
USING (bucket_id = 'incident-documents');

-- ============================================
-- Policies for incident-comment-docs bucket (1 policy)
-- ============================================
DROP POLICY IF EXISTS "Public access to incident comment documents" ON storage.objects;
CREATE POLICY "Public access to incident comment documents" 
ON storage.objects
USING (bucket_id = 'incident-comment-docs');

-- ============================================
-- Policies for edusafe-resources bucket (4 policies)
-- ============================================
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'edusafe-resources');

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" 
ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'edusafe-resources');

DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
CREATE POLICY "Allow public updates" 
ON storage.objects
FOR UPDATE 
TO public
USING (bucket_id = 'edusafe-resources');

DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
CREATE POLICY "Allow public deletes" 
ON storage.objects
FOR DELETE 
TO public
USING (bucket_id = 'edusafe-resources');

-- ============================================
-- Policies for employee-documents bucket (4 policies under storage.objects)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read employee documents" ON storage.objects;
CREATE POLICY "Anyone can read employee documents" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Anyone can upload employee documents" ON storage.objects;
CREATE POLICY "Anyone can upload employee documents" 
ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Anyone can update employee documents" ON storage.objects;
CREATE POLICY "Anyone can update employee documents" 
ON storage.objects
FOR UPDATE 
TO public
USING (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Anyone can delete employee documents" ON storage.objects;
CREATE POLICY "Anyone can delete employee documents" 
ON storage.objects
FOR DELETE 
TO public
USING (bucket_id = 'employee-documents');

-- ============================================
-- Policies for vehicle-documents bucket (4 policies under storage.objects)
-- ============================================
DROP POLICY IF EXISTS "Vehicle documents are accessible by authenticated users" ON storage.objects;
CREATE POLICY "Vehicle documents are accessible by authenticated users" 
ON storage.objects
FOR SELECT 
USING ((bucket_id = 'vehicle-documents') AND (auth.role() = 'authenticated'));

DROP POLICY IF EXISTS "Users can upload vehicle documents" ON storage.objects;
CREATE POLICY "Users can upload vehicle documents" 
ON storage.objects
FOR INSERT 
WITH CHECK ((bucket_id = 'vehicle-documents') AND (auth.role() = 'authenticated'));

DROP POLICY IF EXISTS "Users can update their own vehicle documents" ON storage.objects;
CREATE POLICY "Users can update their own vehicle documents" 
ON storage.objects
FOR UPDATE 
USING ((bucket_id = 'vehicle-documents') AND (auth.role() = 'authenticated'));

DROP POLICY IF EXISTS "Users can delete their own vehicle documents" ON storage.objects;
CREATE POLICY "Users can delete their own vehicle documents" 
ON storage.objects
FOR DELETE 
USING ((bucket_id = 'vehicle-documents') AND (auth.role() = 'authenticated'));
