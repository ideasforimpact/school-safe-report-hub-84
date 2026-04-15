-- Centralized in-app notifications (email-first, future-channel ready)

CREATE TABLE IF NOT EXISTS public.centralized_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_id uuid NULL REFERENCES public.modules(id) ON DELETE SET NULL,
  module_name text NOT NULL,
  email_id uuid NULL REFERENCES public.email_queue(id) ON DELETE SET NULL,
  is_reminder_notification boolean NOT NULL DEFAULT false,
  notification_type text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  title text NULL,
  message text NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.centralized_notifications
  ADD COLUMN IF NOT EXISTS module_name text;

ALTER TABLE public.centralized_notifications
  ADD COLUMN IF NOT EXISTS is_reminder_notification boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.centralized_notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.centralized_notifications(id) ON DELETE CASCADE,
  recipient_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, recipient_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_centralized_notifications_client_module_created
  ON public.centralized_notifications(client_id, module_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_centralized_notifications_client_module_name_created
  ON public.centralized_notifications(client_id, module_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_centralized_notifications_email_id
  ON public.centralized_notifications(email_id);

CREATE INDEX IF NOT EXISTS idx_centralized_notifications_email_id_reminder
  ON public.centralized_notifications(email_id, is_reminder_notification);

CREATE INDEX IF NOT EXISTS idx_centralized_notification_recipients_employee_read_created
  ON public.centralized_notification_recipients(recipient_employee_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_centralized_notification_recipients_notification
  ON public.centralized_notification_recipients(notification_id);

ALTER TABLE public.centralized_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centralized_notification_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own centralized notifications" ON public.centralized_notifications;
CREATE POLICY "Users can view own centralized notifications"
  ON public.centralized_notifications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1
        FROM public.centralized_notification_recipients r
        JOIN public.employees e ON e.id = r.recipient_employee_id
        WHERE r.notification_id = centralized_notifications.id
          AND r.active = true
          AND e.user_id = auth.uid()
      )
      OR public.is_current_user_backoffice_admin() = true
    )
  );

DROP POLICY IF EXISTS "Service role can manage centralized notifications" ON public.centralized_notifications;
CREATE POLICY "Service role can manage centralized notifications"
  ON public.centralized_notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own centralized notification recipients" ON public.centralized_notification_recipients;
CREATE POLICY "Users can view own centralized notification recipients"
  ON public.centralized_notification_recipients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1
        FROM public.employees e
        WHERE e.id = centralized_notification_recipients.recipient_employee_id
          AND e.user_id = auth.uid()
      )
      OR public.is_current_user_backoffice_admin() = true
    )
  );

DROP POLICY IF EXISTS "Users can update own centralized notification recipients" ON public.centralized_notification_recipients;
CREATE POLICY "Users can update own centralized notification recipients"
  ON public.centralized_notification_recipients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = centralized_notification_recipients.recipient_employee_id
        AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = centralized_notification_recipients.recipient_employee_id
        AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage centralized notification recipients" ON public.centralized_notification_recipients;
CREATE POLICY "Service role can manage centralized notification recipients"
  ON public.centralized_notification_recipients
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_centralized_notifications_updated_at ON public.centralized_notifications;
CREATE TRIGGER update_centralized_notifications_updated_at
  BEFORE UPDATE ON public.centralized_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_centralized_notification_recipients_updated_at ON public.centralized_notification_recipients;
CREATE TRIGGER update_centralized_notification_recipients_updated_at
  BEFORE UPDATE ON public.centralized_notification_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

  -- Idempotency guard: avoid duplicates for same email_queue row and recipient.
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

-- Realtime support for header sync
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'centralized_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.centralized_notifications;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'centralized_notification_recipients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.centralized_notification_recipients;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

