-- Add documents metadata column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.employees.documents IS 'Array of uploaded document metadata objects (bucket, storagePath, fileName, mimeType, size, uploadedAt)';

-- Create dedicated bucket for employee profile/compliance uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_profile_documents', 'employee_profile_documents', false)
ON CONFLICT (id) DO NOTHING;