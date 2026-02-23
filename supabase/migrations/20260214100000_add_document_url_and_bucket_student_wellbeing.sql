-- Add document_url (jsonb) to student_well_begin_management for attachment paths
ALTER TABLE public.student_well_begin_management
  ADD COLUMN IF NOT EXISTS document_url jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.student_well_begin_management.document_url IS 'Array of objects: [{ path, name }] for files in student_well_begin_attachements bucket';

-- Storage bucket for well-being record attachments (client_id / record_id / files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('student_well_begin_attachements', 'student_well_begin_attachements', false)
ON CONFLICT (id) DO NOTHING;
