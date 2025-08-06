-- Create dedicated storage bucket for other documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee_other_documents', 'employee_other_documents', true);

-- Create storage policy for public access to other documents
CREATE POLICY "Allow public access to other documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee_other_documents');

-- Create policy for authenticated uploads to other documents
CREATE POLICY "Allow authenticated uploads to other documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee_other_documents');

-- Create policy for authenticated updates to other documents
CREATE POLICY "Allow authenticated updates to other documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'employee_other_documents');

-- Create policy for authenticated deletes of other documents
CREATE POLICY "Allow authenticated deletes of other documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'employee_other_documents');