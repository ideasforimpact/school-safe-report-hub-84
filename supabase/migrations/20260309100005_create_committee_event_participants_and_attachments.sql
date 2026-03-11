-- Add participant and attachment support for committee MOM/events

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committee_event_participants'
  ) THEN
    CREATE TABLE public.committee_event_participants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES public.committee_events(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS committee_event_participants_unique_idx
  ON public.committee_event_participants (event_id, employee_id);

CREATE INDEX IF NOT EXISTS committee_event_participants_event_idx
  ON public.committee_event_participants (event_id);

ALTER TABLE public.committee_event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view committee event participants from their client" ON public.committee_event_participants;
CREATE POLICY "Users can view committee event participants from their client"
  ON public.committee_event_participants
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert committee event participants for their client" ON public.committee_event_participants;
CREATE POLICY "Users can insert committee event participants for their client"
  ON public.committee_event_participants
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete committee event participants from their client" ON public.committee_event_participants;
CREATE POLICY "Users can delete committee event participants from their client"
  ON public.committee_event_participants
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committee_event_attachments'
  ) THEN
    CREATE TABLE public.committee_event_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES public.committee_events(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      file_name text NOT NULL,
      file_type text NULL,
      file_size bigint NULL,
      storage_bucket text NOT NULL DEFAULT 'committee-event-attachments',
      storage_path text NOT NULL,
      file_url text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS committee_event_attachments_event_idx
  ON public.committee_event_attachments (event_id);

ALTER TABLE public.committee_event_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view committee event attachments from their client" ON public.committee_event_attachments;
CREATE POLICY "Users can view committee event attachments from their client"
  ON public.committee_event_attachments
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert committee event attachments for their client" ON public.committee_event_attachments;
CREATE POLICY "Users can insert committee event attachments for their client"
  ON public.committee_event_attachments
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete committee event attachments from their client" ON public.committee_event_attachments;
CREATE POLICY "Users can delete committee event attachments from their client"
  ON public.committee_event_attachments
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

-- Storage bucket for committee event files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'committee-event-attachments',
  'committee-event-attachments',
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

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload committee event attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload committee event attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'committee-event-attachments');

DROP POLICY IF EXISTS "Authenticated users can view committee event attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view committee event attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'committee-event-attachments');
