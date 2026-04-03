-- Committee-level attachments (for Add/Edit Committee form)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committee_attachments'
  ) THEN
    CREATE TABLE public.committee_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      file_name text NOT NULL,
      file_type text NULL,
      file_size bigint NULL,
      storage_bucket text NOT NULL DEFAULT 'committee-attachments',
      storage_path text NOT NULL,
      file_url text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS committee_attachments_committee_idx
  ON public.committee_attachments (committee_id);

ALTER TABLE public.committee_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view committee attachments from their client" ON public.committee_attachments;
CREATE POLICY "Users can view committee attachments from their client"
  ON public.committee_attachments
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert committee attachments for their client" ON public.committee_attachments;
CREATE POLICY "Users can insert committee attachments for their client"
  ON public.committee_attachments
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete committee attachments from their client" ON public.committee_attachments;
CREATE POLICY "Users can delete committee attachments from their client"
  ON public.committee_attachments
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'committee-attachments',
  'committee-attachments',
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

DROP POLICY IF EXISTS "Authenticated users can upload committee attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload committee attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'committee-attachments');

DROP POLICY IF EXISTS "Authenticated users can view committee attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view committee attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'committee-attachments');

