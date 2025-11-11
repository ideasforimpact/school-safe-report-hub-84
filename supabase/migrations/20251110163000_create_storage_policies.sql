-- Create storage policies for ALL buckets matching production
-- This migration creates all storage policies from screenshots

-- ============================================
-- Policies for employee_other_type_statement bucket (4 policies)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to employee_other_type_statement" ON storage.objects;
  CREATE POLICY "Allow public read access to employee_other_type_statement" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'employee_other_type_statement');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow public upload to employee_other_type_statement" ON storage.objects;
  CREATE POLICY "Allow public upload to employee_other_type_statement" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'employee_other_type_statement');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow public update to employee_other_type_statement" ON storage.objects;
  CREATE POLICY "Allow public update to employee_other_type_statement" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'employee_other_type_statement');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow public delete from employee_other_type_statement" ON storage.objects;
  CREATE POLICY "Allow public delete from employee_other_type_statement" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'employee_other_type_statement');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for assessment-question-files bucket (8 policies - including duplicates)
-- ============================================
DO $$
BEGIN
  -- Policy 1: Public access
  DROP POLICY IF EXISTS "Assessment question files are publicly accessible" ON storage.objects;
  CREATE POLICY "Assessment question files are publicly accessible" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'assessment-question-files');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 2: Users can view assessment files from their client
  DROP POLICY IF EXISTS "Users can view assessment files from their client" ON storage.objects;
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
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 3: Users can upload assessment question files
  DROP POLICY IF EXISTS "Users can upload assessment question files" ON storage.objects;
  CREATE POLICY "Users can upload assessment question files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 4: Users can upload assessment files for their client
  DROP POLICY IF EXISTS "Users can upload assessment files for their client" ON storage.objects;
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
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 5: Users can update their own assessment question files
  DROP POLICY IF EXISTS "Users can update their own assessment question files" ON storage.objects;
  CREATE POLICY "Users can update their own assessment question files" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 6: Users can update assessment files from their client
  DROP POLICY IF EXISTS "Users can update assessment files from their client" ON storage.objects;
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
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 7: Users can delete their own assessment question files
  DROP POLICY IF EXISTS "Users can delete their own assessment question files" ON storage.objects;
  CREATE POLICY "Users can delete their own assessment question files" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'assessment-question-files' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  -- Policy 8: Users can delete assessment files from their client
  DROP POLICY IF EXISTS "Users can delete assessment files from their client" ON storage.objects;
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
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for employee_other_documents bucket (4 policies)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public access to other documents" ON storage.objects;
  CREATE POLICY "Allow public access to other documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow authenticated uploads to other documents" ON storage.objects;
  CREATE POLICY "Allow authenticated uploads to other documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow authenticated updates to other documents" ON storage.objects;
  CREATE POLICY "Allow authenticated updates to other documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow authenticated deletes of other documents" ON storage.objects;
  CREATE POLICY "Allow authenticated deletes of other documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for form-attachments bucket (2 policies)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public access to form attachments" ON storage.objects;
  CREATE POLICY "Public access to form attachments" 
  ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'form-attachments');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Authenticated users can upload form attachments" ON storage.objects;
  CREATE POLICY "Authenticated users can upload form attachments" 
  ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'form-attachments');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for compliance_documents bucket (2 policies)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated can read compliance docs" ON storage.objects;
  CREATE POLICY "Authenticated can read compliance docs" 
  ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'compliance_documents' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Authenticated can upload compliance docs" ON storage.objects;
  CREATE POLICY "Authenticated can upload compliance docs" 
  ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'compliance_documents' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for incident-documents bucket (1 policy)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access for incident-documents" ON storage.objects;
  CREATE POLICY "Public Access for incident-documents" 
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'incident-documents')
  WITH CHECK (bucket_id = 'incident-documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for incident-comment-docs bucket (1 policy)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public access to incident comment documents" ON storage.objects;
  CREATE POLICY "Public access to incident comment documents" 
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'incident-comment-docs')
  WITH CHECK (bucket_id = 'incident-comment-docs');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for edusafe-resources bucket (4 policies)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  CREATE POLICY "Public Access" 
  ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'edusafe-resources');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
  CREATE POLICY "Allow public uploads" 
  ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'edusafe-resources');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
  CREATE POLICY "Allow public updates" 
  ON storage.objects
  FOR UPDATE 
  USING (bucket_id = 'edusafe-resources');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
  CREATE POLICY "Allow public deletes" 
  ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'edusafe-resources');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for employee-documents bucket (4 policies under storage.objects)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read employee documents" ON storage.objects;
  CREATE POLICY "Anyone can read employee documents" 
  ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'employee-documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Anyone can upload employee documents" ON storage.objects;
  CREATE POLICY "Anyone can upload employee documents" 
  ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'employee-documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Anyone can update employee documents" ON storage.objects;
  CREATE POLICY "Anyone can update employee documents" 
  ON storage.objects
  FOR UPDATE 
  USING (bucket_id = 'employee-documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Anyone can delete employee documents" ON storage.objects;
  CREATE POLICY "Anyone can delete employee documents" 
  ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'employee-documents');
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- Policies for vehicle-documents bucket (4 policies under storage.objects)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Vehicle documents are accessible by authenticated users" ON storage.objects;
  CREATE POLICY "Vehicle documents are accessible by authenticated users" 
  ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Users can upload vehicle documents" ON storage.objects;
  CREATE POLICY "Users can upload vehicle documents" 
  ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Users can update their own vehicle documents" ON storage.objects;
  CREATE POLICY "Users can update their own vehicle documents" 
  ON storage.objects
  FOR UPDATE 
  USING (bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

  DROP POLICY IF EXISTS "Users can delete their own vehicle documents" ON storage.objects;
  CREATE POLICY "Users can delete their own vehicle documents" 
  ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
END $$;

