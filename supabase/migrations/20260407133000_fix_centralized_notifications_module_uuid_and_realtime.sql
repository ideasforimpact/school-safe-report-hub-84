-- Hotfix migration for already-applied environments:
-- 1) module_id -> uuid FK to modules
-- 2) add module_name
-- 3) idempotent centralized notification creation
-- 4) enable realtime publication

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'centralized_notifications'
  ) THEN
    -- Add module_name if missing
    ALTER TABLE public.centralized_notifications
      ADD COLUMN IF NOT EXISTS module_name text;
    ALTER TABLE public.centralized_notifications
      ADD COLUMN IF NOT EXISTS is_reminder_notification boolean NOT NULL DEFAULT false;

    -- Backfill module_name if null
    UPDATE public.centralized_notifications
    SET module_name = COALESCE(NULLIF(module_name, ''), 'general')
    WHERE module_name IS NULL OR module_name = '';

    -- Convert module_id from text to uuid safely only if currently text
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'centralized_notifications'
        AND column_name = 'module_id'
        AND data_type IN ('text', 'character varying')
    ) THEN
      ALTER TABLE public.centralized_notifications
        ALTER COLUMN module_id DROP DEFAULT;

      ALTER TABLE public.centralized_notifications
        ALTER COLUMN module_id TYPE uuid
        USING NULL::uuid;
    END IF;

    -- Ensure NOT NULL on module_name
    ALTER TABLE public.centralized_notifications
      ALTER COLUMN module_name SET NOT NULL;

    -- Ensure FK for module_id exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'centralized_notifications_module_id_fkey'
    ) THEN
      ALTER TABLE public.centralized_notifications
        ADD CONSTRAINT centralized_notifications_module_id_fkey
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;
    END IF;

    -- Ensure module_name index exists
    CREATE INDEX IF NOT EXISTS idx_centralized_notifications_client_module_name_created
      ON public.centralized_notifications(client_id, module_name, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_centralized_notifications_email_id_reminder
      ON public.centralized_notifications(email_id, is_reminder_notification);
  END IF;
END $$;

-- Replace old function variants
DROP FUNCTION IF EXISTS public.create_centralized_notification(uuid, text, uuid, text, text, text, text, jsonb, uuid, text);
DROP FUNCTION IF EXISTS public.create_centralized_notification(uuid, uuid, text, uuid, text, text, text, text, jsonb, uuid, text);
DROP FUNCTION IF EXISTS public.create_centralized_notification(uuid, uuid, text, uuid, boolean, text, text, text, text, jsonb, uuid, text);

CREATE OR REPLACE FUNCTION public.create_centralized_notification(
  p_client_id uuid,
  p_module_id uuid DEFAULT NULL,
  p_module_name text DEFAULT NULL,
  p_email_id uuid DEFAULT NULL,
  p_is_reminder_notification boolean DEFAULT false,
  p_notification_type text DEFAULT 'email_notification',
  p_channel text DEFAULT 'email',
  p_title text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_recipient_employee_id uuid DEFAULT NULL,
  p_recipient_email text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
  v_recipient_employee_id uuid;
  v_module_id uuid;
  v_module_name text;
  v_existing_notification_id uuid;
  v_is_reminder_notification boolean;
BEGIN
  IF p_client_id IS NULL THEN
    RETURN false;
  END IF;

  v_module_id := p_module_id;
  v_module_name := NULLIF(trim(COALESCE(p_module_name, '')), '');

  IF v_module_id IS NULL AND v_module_name IS NOT NULL THEN
    SELECT m.id
      INTO v_module_id
    FROM public.modules m
    WHERE (
      lower(m.name) = lower(v_module_name)
      OR regexp_replace(lower(m.name), 's$', '') = regexp_replace(lower(v_module_name), 's$', '')
    )
      AND m.active = true
    LIMIT 1;
  END IF;

  IF v_module_name IS NULL AND v_module_id IS NOT NULL THEN
    SELECT m.name
      INTO v_module_name
    FROM public.modules m
    WHERE m.id = v_module_id
    LIMIT 1;
  END IF;

  IF v_module_name IS NULL THEN
    v_module_name := 'general';
  END IF;

  v_is_reminder_notification := COALESCE(p_is_reminder_notification, false);

  v_recipient_employee_id := p_recipient_employee_id;

  IF v_recipient_employee_id IS NULL AND p_recipient_email IS NOT NULL THEN
    SELECT e.id
      INTO v_recipient_employee_id
    FROM public.employees e
    WHERE e.client_id = p_client_id
      AND lower(e.email) = lower(p_recipient_email)
    LIMIT 1;
  END IF;

  IF v_recipient_employee_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_email_id IS NOT NULL THEN
    SELECT n.id
      INTO v_existing_notification_id
    FROM public.centralized_notifications n
    JOIN public.centralized_notification_recipients r
      ON r.notification_id = n.id
    WHERE n.email_id = p_email_id
      AND n.is_reminder_notification = v_is_reminder_notification
      AND r.recipient_employee_id = v_recipient_employee_id
      AND n.active = true
      AND r.active = true
    LIMIT 1;

    IF v_existing_notification_id IS NOT NULL THEN
      RETURN true;
    END IF;
  END IF;

  INSERT INTO public.centralized_notifications (
    client_id,
    module_id,
    module_name,
    email_id,
    is_reminder_notification,
    notification_type,
    channel,
    title,
    message,
    payload,
    active
  )
  VALUES (
    p_client_id,
    v_module_id,
    v_module_name,
    p_email_id,
    v_is_reminder_notification,
    p_notification_type,
    p_channel,
    p_title,
    p_message,
    COALESCE(p_payload, '{}'::jsonb),
    true
  )
  RETURNING id INTO v_notification_id;

  INSERT INTO public.centralized_notification_recipients (
    notification_id,
    recipient_employee_id,
    is_read,
    active
  )
  VALUES (
    v_notification_id,
    v_recipient_employee_id,
    false,
    true
  )
  ON CONFLICT (notification_id, recipient_employee_id) DO NOTHING;

  RETURN true;
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_centralized_notification(
  uuid, uuid, text, uuid, boolean, text, text, text, text, jsonb, uuid, text
) TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.centralized_notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.centralized_notification_recipients;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

