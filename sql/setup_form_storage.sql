-- Create storage bucket for form attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-attachments',
  'form-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Public access to form attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'form-attachments');

CREATE POLICY "Authenticated users can upload form attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'form-attachments');

-- Allow public access to form submissions (for the public form)
CREATE POLICY "Public can insert form submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- Allow form owners to view submissions
CREATE POLICY "Form owners can view submissions" ON form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT id FROM custom_forms 
      WHERE client_id IN (
        SELECT client_id FROM employees WHERE user_id = auth.uid() AND status = true
      )
    )
  ); 