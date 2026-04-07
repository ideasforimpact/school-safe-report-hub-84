-- Attachments uploaded from Incident Closure form (optional)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'incident_closure_attachments'
  ) THEN
    CREATE TABLE public.incident_closure_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      file_name text NOT NULL,
      file_type text NULL,
      file_size bigint NULL,
      storage_bucket text NOT NULL DEFAULT 'incident-closure-attachments',
      storage_path text NOT NULL,
      file_url text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS incident_closure_attachments_incident_idx
  ON public.incident_closure_attachments (incident_id);

ALTER TABLE public.incident_closure_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view incident closure attachments from their client" ON public.incident_closure_attachments;
CREATE POLICY "Users can view incident closure attachments from their client"
  ON public.incident_closure_attachments
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert incident closure attachments for their client" ON public.incident_closure_attachments;
CREATE POLICY "Users can insert incident closure attachments for their client"
  ON public.incident_closure_attachments
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete incident closure attachments from their client" ON public.incident_closure_attachments;
CREATE POLICY "Users can delete incident closure attachments from their client"
  ON public.incident_closure_attachments
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-closure-attachments',
  'incident-closure-attachments',
  true,
  52428800,
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can upload incident closure attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload incident closure attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-closure-attachments');

DROP POLICY IF EXISTS "Authenticated users can view incident closure attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view incident closure attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'incident-closure-attachments');
