-- Create storage buckets for various file types
-- This migration creates ALL storage buckets matching production

-- 1. Create storage bucket for employee other type statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_other_type_statement', 'employee_other_type_statement', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create storage bucket for assessment question files (public access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-question-files', 'assessment-question-files', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create storage bucket for employee other documents (public access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee_other_documents', 'employee_other_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Create storage bucket for form attachments (public access, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-attachments',
  'form-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create storage bucket for compliance documents (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance_documents', 'compliance_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage bucket for incident documents (public access, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-documents',
  'incident-documents',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'video/mp4', 'video/avi', 'video/mov']
)
ON CONFLICT (id) DO NOTHING;

-- 7. Create storage bucket for incident comment documents (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-comment-docs', 'incident-comment-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create storage bucket for client logos (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Create storage bucket for edusafe resources (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('edusafe-resources', 'edusafe-resources', true)
ON CONFLICT (id) DO NOTHING;

-- 10. Create storage bucket for employee documents (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Create storage bucket for vehicle documents (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', true)
ON CONFLICT (id) DO NOTHING;

