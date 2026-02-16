-- Add queue_id to monthly_export_email (FK to monthly_export_queue) for clear architecture: one email row links to one queue job
ALTER TABLE public.monthly_export_email
  ADD COLUMN IF NOT EXISTS queue_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_queue_id_fkey') THEN
    ALTER TABLE public.monthly_export_email
      ADD CONSTRAINT monthly_export_email_queue_id_fkey
      FOREIGN KEY (queue_id) REFERENCES public.monthly_export_queue(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_monthly_export_email_queue_id ON public.monthly_export_email (queue_id);

-- RPC: include queue_id when inserting monthly_export_email
CREATE OR REPLACE FUNCTION public.monthly_export_queue_complete(
  p_queue_id uuid,
  p_document_path text,
  p_recipient_email text,
  p_recipient_name text,
  p_subject text,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.monthly_export_queue%ROWTYPE;
  v_email_id uuid;
BEGIN
  SELECT * INTO v_row FROM public.monthly_export_queue WHERE id = p_queue_id AND active = true FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_export_queue row not found or inactive: %', p_queue_id;
  END IF;

  UPDATE public.monthly_export_queue
  SET is_queued = true,
      status = 'completed',
      updated_at = now()
  WHERE id = p_queue_id;

  INSERT INTO public.monthly_export_email (
    client_id,
    queue_id,
    target_employee_id,
    recipient_email,
    recipient_name,
    body,
    subject,
    is_send,
    send_at,
    document_url,
    error_msg,
    retry_count,
    max_retries,
    scheduled_at,
    active,
    created_at,
    updated_at
  ) VALUES (
    v_row.client_id,
    p_queue_id,
    v_row.target_employee_id,
    p_recipient_email,
    p_recipient_name,
    p_body,
    p_subject,
    false,
    NULL,
    p_document_path,
    NULL,
    0,
    2,
    now(),
    true,
    now(),
    now()
  )
  RETURNING id INTO v_email_id;

  RETURN v_email_id;
END;
$$;
