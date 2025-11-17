-- Create storage policies for employee-documents and vehicle-documents buckets
-- These policies appear under "OTHER POLICIES UNDER STORAGE.OBJECTS" in Supabase Studio
-- This migration ensures these 8 policies are created independently

-- Ensure storage schema exists and RLS is enabled
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- RLS might already be enabled, ignore error
  NULL;
END $$;

-- ============================================
-- Policies for employee-documents bucket (4 policies)
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
-- Policies for vehicle-documents bucket (4 policies)
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

