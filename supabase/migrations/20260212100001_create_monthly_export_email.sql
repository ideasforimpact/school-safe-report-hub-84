-- monthly_export_email: email records for sending monthly report link to super admin
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_pkey') THEN
    ALTER TABLE public.monthly_export_email ADD CONSTRAINT monthly_export_email_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_client_id_fkey') THEN
    ALTER TABLE public.monthly_export_email
      ADD CONSTRAINT monthly_export_email_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_export_queue')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_queue_id_fkey') THEN
    ALTER TABLE public.monthly_export_email
      ADD CONSTRAINT monthly_export_email_queue_id_fkey
      FOREIGN KEY (queue_id) REFERENCES public.monthly_export_queue(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_email_target_employee_id_fkey') THEN
    ALTER TABLE public.monthly_export_email
      ADD CONSTRAINT monthly_export_email_target_employee_id_fkey
      FOREIGN KEY (target_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_monthly_export_email_client_id ON public.monthly_export_email (client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_export_email_queue_id ON public.monthly_export_email (queue_id);
CREATE INDEX IF NOT EXISTS idx_monthly_export_email_is_send ON public.monthly_export_email (is_send, active) WHERE is_send = false AND active = true;

-- RLS (same pattern as employees)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_export_email') THEN
    ALTER TABLE public.monthly_export_email ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view monthly_export_email for their client" ON public.monthly_export_email;
    CREATE POLICY "Users can view monthly_export_email for their client" ON public.monthly_export_email
    FOR SELECT USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    DROP POLICY IF EXISTS "Users can insert monthly_export_email for their client" ON public.monthly_export_email;
    CREATE POLICY "Users can insert monthly_export_email for their client" ON public.monthly_export_email
    FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    DROP POLICY IF EXISTS "Users can update monthly_export_email for their client" ON public.monthly_export_email;
    CREATE POLICY "Users can update monthly_export_email for their client" ON public.monthly_export_email
    FOR UPDATE USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    DROP POLICY IF EXISTS "Service role can manage monthly_export_email" ON public.monthly_export_email;
    CREATE POLICY "Service role can manage monthly_export_email" ON public.monthly_export_email
    FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
