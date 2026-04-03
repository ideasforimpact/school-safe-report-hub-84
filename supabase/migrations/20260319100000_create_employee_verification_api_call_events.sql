-- Aadhaar Option A: store one row per provider API attempt.
-- This is used for operations like generate_otp / verify_otp where multiple providers can be called.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employee_verification_api_call_events'
  ) THEN
    CREATE TABLE public.employee_verification_api_call_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

      summary_id uuid NULL,
      client_id uuid NOT NULL,
      employee_id uuid NOT NULL,
      document_id uuid NOT NULL,
      document_type uuid NOT NULL,

      provider text NOT NULL,
      provider_role text NOT NULL CHECK (provider_role IN ('primary', 'fallback')),
      operation text NOT NULL CHECK (operation IN ('generate_otp', 'verify_otp')),
      result text NOT NULL CHECK (result IN ('success', 'failed')),

      request_group_id text,

      total_counts_after jsonb NOT NULL DEFAULT '{}'::jsonb,
      provider_counts_after jsonb NOT NULL DEFAULT '{}'::jsonb,
      provider_operation_counts_after jsonb NOT NULL DEFAULT '{}'::jsonb,

      api_response jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    -- Foreign keys
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employee_verification_api_calls'
    ) THEN
      ALTER TABLE public.employee_verification_api_call_events
        ADD CONSTRAINT fk_ev_api_call_events_summary
        FOREIGN KEY (summary_id)
        REFERENCES public.employee_verification_api_calls(id)
        ON DELETE SET NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'clients'
    ) THEN
      ALTER TABLE public.employee_verification_api_call_events
        ADD CONSTRAINT fk_ev_api_call_events_client
        FOREIGN KEY (client_id)
        REFERENCES public.clients(id)
        ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employees'
    ) THEN
      ALTER TABLE public.employee_verification_api_call_events
        ADD CONSTRAINT fk_ev_api_call_events_employee
        FOREIGN KEY (employee_id)
        REFERENCES public.employees(id)
        ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employee_documents'
    ) THEN
      ALTER TABLE public.employee_verification_api_call_events
        ADD CONSTRAINT fk_ev_api_call_events_document
        FOREIGN KEY (document_id)
        REFERENCES public.employee_documents(id)
        ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employee_document_type'
    ) THEN
      ALTER TABLE public.employee_verification_api_call_events
        ADD CONSTRAINT fk_ev_api_call_events_document_type
        FOREIGN KEY (document_type)
        REFERENCES public.employee_document_type(id)
        ON DELETE CASCADE;
    END IF;

    -- Helpful indexes
    CREATE INDEX IF NOT EXISTS idx_ev_api_call_events_document_id
      ON public.employee_verification_api_call_events (document_id);
    CREATE INDEX IF NOT EXISTS idx_ev_api_call_events_provider_operation
      ON public.employee_verification_api_call_events (provider, operation);
    CREATE INDEX IF NOT EXISTS idx_ev_api_call_events_created_at
      ON public.employee_verification_api_call_events (created_at);
    CREATE INDEX IF NOT EXISTS idx_ev_api_call_events_request_group_id
      ON public.employee_verification_api_call_events (request_group_id);
  END IF;
END $$;

-- Keep consistent with existing tracking table (RLS disabled for now).
ALTER TABLE IF EXISTS public.employee_verification_api_call_events DISABLE ROW LEVEL SECURITY;

