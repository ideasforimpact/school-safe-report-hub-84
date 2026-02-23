-- monthly_export_queue: queue rows for monthly report generation (prepare_* = cron run date, target_* = report month-end)
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_queue_pkey') THEN
    ALTER TABLE public.monthly_export_queue ADD CONSTRAINT monthly_export_queue_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_queue_client_id_fkey') THEN
    ALTER TABLE public.monthly_export_queue
      ADD CONSTRAINT monthly_export_queue_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_export_queue_target_employee_id_fkey') THEN
    ALTER TABLE public.monthly_export_queue
      ADD CONSTRAINT monthly_export_queue_target_employee_id_fkey
      FOREIGN KEY (target_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_monthly_export_queue_client_id ON public.monthly_export_queue (client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_export_queue_prepare ON public.monthly_export_queue (prepare_year, prepare_month, prepare_date);
CREATE INDEX IF NOT EXISTS idx_monthly_export_queue_is_queued_active ON public.monthly_export_queue (is_queued, active) WHERE is_queued = true AND active = true;

-- RLS (same pattern as employees: client_id / backoffice)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_export_queue') THEN
    ALTER TABLE public.monthly_export_queue ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view monthly_export_queue for their client" ON public.monthly_export_queue;
    CREATE POLICY "Users can view monthly_export_queue for their client" ON public.monthly_export_queue
    FOR SELECT USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    DROP POLICY IF EXISTS "Users can insert monthly_export_queue for their client" ON public.monthly_export_queue;
    CREATE POLICY "Users can insert monthly_export_queue for their client" ON public.monthly_export_queue
    FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    DROP POLICY IF EXISTS "Users can update monthly_export_queue for their client" ON public.monthly_export_queue;
    CREATE POLICY "Users can update monthly_export_queue for their client" ON public.monthly_export_queue
    FOR UPDATE USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    DROP POLICY IF EXISTS "Service role can manage monthly_export_queue" ON public.monthly_export_queue;
    CREATE POLICY "Service role can manage monthly_export_queue" ON public.monthly_export_queue
    FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
