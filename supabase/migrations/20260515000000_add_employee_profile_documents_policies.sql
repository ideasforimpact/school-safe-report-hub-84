-- Add storage RLS policies for the employee_profile_documents bucket.
--
-- The bucket was created in 20260506071505_create_new_user_documents.sql
-- without any policies on storage.objects. Because RLS is enabled on
-- storage.objects, signed-URL fetches from the client (used by the
-- Edit User dialog View/Download buttons) return a 404 "Object not
-- found" — Supabase masks RLS denials as 404 to avoid information leakage.
--
-- This migration mirrors the policy pattern used for the existing
-- employee-documents bucket (see 20251110000050_create_storage_objects_policies.sql)
-- so behavior is consistent across the two employee buckets.

DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DROP POLICY IF EXISTS "Anyone can read employee profile documents" ON storage.objects;
CREATE POLICY "Anyone can read employee profile documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'employee_profile_documents');

DROP POLICY IF EXISTS "Anyone can upload employee profile documents" ON storage.objects;
CREATE POLICY "Anyone can upload employee profile documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'employee_profile_documents');

DROP POLICY IF EXISTS "Anyone can update employee profile documents" ON storage.objects;
CREATE POLICY "Anyone can update employee profile documents"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'employee_profile_documents');

DROP POLICY IF EXISTS "Anyone can delete employee profile documents" ON storage.objects;
CREATE POLICY "Anyone can delete employee profile documents"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'employee_profile_documents');
