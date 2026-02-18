-- monthly_export_queue_complete: add target params, insert target_* into monthly_export_email,
-- and skip insert (update queue error_queue_msg) when same client_id, target_employee_id, target_date/month/year already exists.
-- monthly_export_queue_fail: add target params and include in error_queue_msg.

DROP FUNCTION IF EXISTS public.monthly_export_queue_complete(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.monthly_export_queue_fail(uuid, text);

CREATE OR REPLACE FUNCTION public.monthly_export_queue_complete(
  p_queue_id uuid,
  p_document_path text,
  p_recipient_email text,
  p_recipient_name text,
  p_subject text,
  p_body text,
  p_target_date int,
  p_target_month int,
  p_target_year int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.monthly_export_queue%ROWTYPE;
  v_email_id uuid;
  v_exists boolean;
BEGIN
  SELECT * INTO v_row FROM public.monthly_export_queue WHERE id = p_queue_id AND active = true FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_export_queue row not found or inactive: %', p_queue_id;
  END IF;

  -- Check if monthly_export_email already has a row for this client, employee and target period
  SELECT EXISTS(
    SELECT 1 FROM public.monthly_export_email
    WHERE client_id = v_row.client_id
      AND target_employee_id = v_row.target_employee_id
      AND target_date = p_target_date
      AND target_month = p_target_month
      AND target_year = p_target_year
      AND active = true
  ) INTO v_exists;

  IF v_exists THEN
    -- Do not insert; update queue with error message and leave status as non-completed
    UPDATE public.monthly_export_queue
    SET is_queued = false,
        error_queue_msg = jsonb_build_object(
          'date', v_row.prepare_date,
          'month', v_row.prepare_month,
          'year', v_row.prepare_year,
          'target_date', p_target_date,
          'target_month', p_target_month,
          'target_year', p_target_year,
          'status', false,
          'reason', 'Duplicate: email already exists for this client, employee and target period'
        ),
        updated_at = now()
    WHERE id = p_queue_id;
    RETURN NULL;
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
    target_date,
    target_month,
    target_year,
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
    p_target_date,
    p_target_month,
    p_target_year,
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

CREATE OR REPLACE FUNCTION public.monthly_export_queue_fail(
  p_queue_id uuid,
  p_reason text,
  p_target_date int DEFAULT NULL,
  p_target_month int DEFAULT NULL,
  p_target_year int DEFAULT NULL
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
        'target_date', COALESCE(p_target_date, v_row.target_date),
        'target_month', COALESCE(p_target_month, v_row.target_month),
        'target_year', COALESCE(p_target_year, v_row.target_year),
        'status', false,
        'reason', p_reason
      ),
  retry_count = v_new_count,
  status = CASE WHEN v_new_count >= v_row.max_retries THEN 'failed' ELSE v_row.status END,
  updated_at = now()
  WHERE id = p_queue_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.monthly_export_queue_complete(uuid, text, text, text, text, text, int, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.monthly_export_queue_fail(uuid, text, int, int, int) TO service_role;
