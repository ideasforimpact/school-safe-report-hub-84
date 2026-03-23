-- Create employee_verification_api_calls table for tracking external verification API results
-- RLS is intentionally disabled for now (per product requirement).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employee_verification_api_calls'
  ) THEN
    CREATE TABLE public.employee_verification_api_calls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

      client_id uuid NOT NULL,
      employee_id uuid NOT NULL,
      document_id uuid NOT NULL,
      document_type uuid NOT NULL,
      provider text NOT NULL,

      is_multiple boolean NOT NULL DEFAULT false,

      success integer NOT NULL DEFAULT 0,
      failed integer NOT NULL DEFAULT 0,

      -- For fallback/secondary providers: per-provider counters.
      -- Shape examples:
      --   other_provider_success_call = { "surepass": { "success": 1 }, ... }
      --   other_provider_failed_call  = { "surepass": { "failed": 1 }, ... }
      other_provider_success_call jsonb NOT NULL DEFAULT '{}'::jsonb,
      other_provider_failed_call jsonb NOT NULL DEFAULT '{}'::jsonb,

      -- Stored as an object keyed by ISO timestamp:
      -- { "<date_time_iso>": { provider, success, error }, ... }
      audit jsonb NOT NULL DEFAULT '{}'::jsonb,

      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Foreign keys (best-effort: only add if referenced tables exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'clients'
    ) THEN
      ALTER TABLE public.employee_verification_api_calls
        ADD CONSTRAINT fk_employee_verification_api_calls_client
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employees'
    ) THEN
      ALTER TABLE public.employee_verification_api_calls
        ADD CONSTRAINT fk_employee_verification_api_calls_employee
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employee_documents'
    ) THEN
      ALTER TABLE public.employee_verification_api_calls
        ADD CONSTRAINT fk_employee_verification_api_calls_document
        FOREIGN KEY (document_id) REFERENCES public.employee_documents(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employee_document_type'
    ) THEN
      ALTER TABLE public.employee_verification_api_calls
        ADD CONSTRAINT fk_employee_verification_api_calls_document_type
        FOREIGN KEY (document_type) REFERENCES public.employee_document_type(id) ON DELETE CASCADE;
    END IF;

    -- Helpful indexes
    CREATE INDEX IF NOT EXISTS idx_eva_calls_client_id ON public.employee_verification_api_calls (client_id);
    CREATE INDEX IF NOT EXISTS idx_eva_calls_employee_id ON public.employee_verification_api_calls (employee_id);
    CREATE INDEX IF NOT EXISTS idx_eva_calls_document_id ON public.employee_verification_api_calls (document_id);
    CREATE INDEX IF NOT EXISTS idx_eva_calls_document_type ON public.employee_verification_api_calls (document_type);
    CREATE INDEX IF NOT EXISTS idx_eva_calls_provider ON public.employee_verification_api_calls (provider);
    CREATE INDEX IF NOT EXISTS idx_eva_calls_created_at ON public.employee_verification_api_calls (created_at);
  END IF;
END $$;

-- Disable RLS for this table (and drop any policies if they somehow exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employee_verification_api_calls'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = 'employee_verification_api_calls'
        AND c.relrowsecurity = true
    ) THEN
      -- If any RLS policies exist (from previous runs), drop them
      DROP POLICY IF EXISTS "Any access" ON public.employee_verification_api_calls;
      DROP POLICY IF EXISTS "Read for authenticated" ON public.employee_verification_api_calls;
      DROP POLICY IF EXISTS "Write for authenticated" ON public.employee_verification_api_calls;

      ALTER TABLE public.employee_verification_api_calls DISABLE ROW LEVEL SECURITY;
      RAISE NOTICE 'RLS disabled for employee_verification_api_calls';
    END IF;
  END IF;
END $$;

