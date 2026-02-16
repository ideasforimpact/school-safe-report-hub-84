-- Storage bucket for CPD learning attachments (client_id / cpd_entries_id / files)
-- Public so direct URLs can be used for view/download

INSERT INTO storage.buckets (id, name, public)
VALUES ('cpd_learning_attachments', 'cpd_learning_attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read
DROP POLICY IF EXISTS "Allow public read cpd_learning_attachments" ON storage.objects;
CREATE POLICY "Allow public read cpd_learning_attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cpd_learning_attachments');
