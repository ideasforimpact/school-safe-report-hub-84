-- Make student well-being attachments bucket public so the app can build
-- direct URLs (VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL + path) for view/download
-- without calling the sign API.
UPDATE storage.buckets
SET public = true
WHERE id = 'student_well_begin_attachements';

-- Allow public read so direct public URLs work
DROP POLICY IF EXISTS "Allow public read student_well_begin_attachements" ON storage.objects;
CREATE POLICY "Allow public read student_well_begin_attachements"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'student_well_begin_attachements');
