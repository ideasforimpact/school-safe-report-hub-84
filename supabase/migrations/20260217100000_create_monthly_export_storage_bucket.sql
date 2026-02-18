-- Create storage bucket for monthly export PDFs (if not exists) and make it public
-- Used for monthly compliance report document URLs in monthly_export_email

INSERT INTO storage.buckets (id, name, public)
VALUES ('monthly_export', 'monthly_export', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read so report links in emails work without auth
DROP POLICY IF EXISTS "Allow public read access to monthly_export" ON storage.objects;
CREATE POLICY "Allow public read access to monthly_export"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'monthly_export');

-- Allow authenticated/service uploads (reports are uploaded by backend)
DROP POLICY IF EXISTS "Allow upload to monthly_export" ON storage.objects;
CREATE POLICY "Allow upload to monthly_export"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'monthly_export');

DROP POLICY IF EXISTS "Allow update to monthly_export" ON storage.objects;
CREATE POLICY "Allow update to monthly_export"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'monthly_export');

DROP POLICY IF EXISTS "Allow delete from monthly_export" ON storage.objects;
CREATE POLICY "Allow delete from monthly_export"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'monthly_export');
