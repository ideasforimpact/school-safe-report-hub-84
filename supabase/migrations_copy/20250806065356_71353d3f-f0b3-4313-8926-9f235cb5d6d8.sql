-- Create dedicated storage bucket for other documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee_other_documents', 'employee_other_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public access to other documents
-- Use DO block to handle permission errors gracefully
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public access to other documents" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore permission errors
  NULL;
END $$;

DO $$
BEGIN
CREATE POLICY "Allow public access to other documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, skip
  NULL;
END $$;

-- Create policy for authenticated uploads to other documents
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated uploads to other documents" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore permission errors
  NULL;
END $$;

DO $$
BEGIN
CREATE POLICY "Allow authenticated uploads to other documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, skip
  NULL;
END $$;

-- Create policy for authenticated updates to other documents
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated updates to other documents" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore permission errors
  NULL;
END $$;

DO $$
BEGIN
CREATE POLICY "Allow authenticated updates to other documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, skip
  NULL;
END $$;

-- Create policy for authenticated deletes of other documents
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated deletes of other documents" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore permission errors
  NULL;
END $$;

DO $$
BEGIN
CREATE POLICY "Allow authenticated deletes of other documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'employee_other_documents');
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, skip
  NULL;
END $$;