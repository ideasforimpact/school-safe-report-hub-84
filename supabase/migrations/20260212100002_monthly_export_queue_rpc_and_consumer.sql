-- Ensure tables exist before creating RPCs (in case 20260212100000 / 20260212100001 were skipped or ran after this)
CREATE TABLE IF NOT EXISTS public.monthly_export_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  target_employee_id uuid NOT NULL,
  target_month int NOT NULL,
  target_date int NOT NULL,
  target_year int NOT NULL,
  prepare_month int NOT NULL,
  prepare_date int NOT NULL,
  prepare_year int NOT NULL,
  is_queued boolean NOT NULL DEFAULT true,
  error_queue_msg jsonb,
  retry_count int NOT NULL DEFAULT 0,
  max_retries int NOT NULL DEFAULT 2,
  active boolean NOT NULL DEFAULT true,
  status text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.monthly_export_email (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  queue_id uuid,
  target_employee_id uuid NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  body text,
  subject text,
  is_send boolean NOT NULL DEFAULT false,
  send_at timestamptz,
  document_url text,
  error_msg jsonb,
  retry_count int NOT NULL DEFAULT 0,
  max_retries int NOT NULL DEFAULT 2,
  scheduled_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_queue_pkey') THEN
    ALTER TABLE public.monthly_export_queue ADD CONSTRAINT monthly_export_queue_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_pkey') THEN
    ALTER TABLE public.monthly_export_email ADD CONSTRAINT monthly_export_email_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_queue_client_id_fkey') THEN
    ALTER TABLE public.monthly_export_queue ADD CONSTRAINT monthly_export_queue_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_queue_target_employee_id_fkey') THEN
    ALTER TABLE public.monthly_export_queue ADD CONSTRAINT monthly_export_queue_target_employee_id_fkey
      FOREIGN KEY (target_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_client_id_fkey') THEN
    ALTER TABLE public.monthly_export_email ADD CONSTRAINT monthly_export_email_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_export_queue')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_queue_id_fkey') THEN
    ALTER TABLE public.monthly_export_email ADD CONSTRAINT monthly_export_email_queue_id_fkey
      FOREIGN KEY (queue_id) REFERENCES public.monthly_export_queue(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_target_employee_id_fkey') THEN
    ALTER TABLE public.monthly_export_email ADD CONSTRAINT monthly_export_email_target_employee_id_fkey
      FOREIGN KEY (target_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_monthly_export_queue_client_id ON public.monthly_export_queue (client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_export_queue_prepare ON public.monthly_export_queue (prepare_year, prepare_month, prepare_date);
CREATE INDEX IF NOT EXISTS idx_monthly_export_queue_is_queued_active ON public.monthly_export_queue (is_queued, active) WHERE is_queued = true AND active = true;
CREATE INDEX IF NOT EXISTS idx_monthly_export_email_client_id ON public.monthly_export_email (client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_export_email_queue_id ON public.monthly_export_email (queue_id);
CREATE INDEX IF NOT EXISTS idx_monthly_export_email_is_send ON public.monthly_export_email (is_send, active) WHERE is_send = false AND active = true;

-- RPC: mark queue row as completed and insert monthly_export_email row
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

-- RPC: mark queue row as failed (set error_queue_msg, increment retry_count, set status if max retries reached)
CREATE OR REPLACE FUNCTION public.monthly_export_queue_fail(
  p_queue_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.monthly_export_queue%ROWTYPE;
  v_new_count int;
BEGIN
  SELECT * INTO v_row FROM public.monthly_export_queue WHERE id = p_queue_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_export_queue row not found: %', p_queue_id;
  END IF;

  v_new_count := v_row.retry_count + 1;

  UPDATE public.monthly_export_queue
  SET is_queued = false,
      error_queue_msg = jsonb_build_object(
    'date', v_row.prepare_date,
    'month', v_row.prepare_month,
    'year', v_row.prepare_year,
    'status', false,
    'reason', p_reason
  ),
  retry_count = v_new_count,
  status = CASE WHEN v_new_count >= v_row.max_retries THEN 'failed' ELSE v_row.status END,
  updated_at = now()
  WHERE id = p_queue_id;
END;
$$;

-- updated_at triggers for both tables (set_updated_at already exists)
DROP TRIGGER IF EXISTS monthly_export_queue_updated_at ON public.monthly_export_queue;
CREATE TRIGGER monthly_export_queue_updated_at
  BEFORE UPDATE ON public.monthly_export_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS monthly_export_email_updated_at ON public.monthly_export_email;
CREATE TRIGGER monthly_export_email_updated_at
  BEFORE UPDATE ON public.monthly_export_email
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT EXECUTE ON FUNCTION public.monthly_export_queue_complete(uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.monthly_export_queue_fail(uuid, text) TO service_role;
