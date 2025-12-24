-- Create storage bucket for visitors evidence files
-- Public bucket with full public access (RLS effectively disabled via public policies)

-- Create the bucket (public = true means public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('visitors_evidence', 'visitors_evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure storage.objects RLS is enabled (required for policies)
DO $$
BEGIN
  ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- RLS might already be enabled, ignore error
  NULL;
END $$;

-- Create public policies to allow all operations (effectively disabling RLS restrictions)
-- Policy 1: Allow public read access
DROP POLICY IF EXISTS "Allow public read access to visitors_evidence" ON storage.objects;
CREATE POLICY "Allow public read access to visitors_evidence" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'visitors_evidence');

-- Policy 2: Allow public upload
DROP POLICY IF EXISTS "Allow public upload to visitors_evidence" ON storage.objects;
CREATE POLICY "Allow public upload to visitors_evidence" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'visitors_evidence');

-- Policy 3: Allow public update
DROP POLICY IF EXISTS "Allow public update to visitors_evidence" ON storage.objects;
CREATE POLICY "Allow public update to visitors_evidence" 
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'visitors_evidence');

-- Policy 4: Allow public delete
DROP POLICY IF EXISTS "Allow public delete from visitors_evidence" ON storage.objects;
CREATE POLICY "Allow public delete from visitors_evidence" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'visitors_evidence');

