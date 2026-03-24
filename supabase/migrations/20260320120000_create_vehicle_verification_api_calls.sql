-- Vehicle verification external API call tracking (RC + Challan, multi-provider)
-- Mirrors the idea of employee_verification_api_calls: one summary row per vehicle.
-- Primary: QuickEKYC; fallback: Surepass (counts + audit capture each attempt).
--
-- Count semantics (integers are totals of API outcomes, not "requests"):
--   rc_success / rc_failed        — RC verification API attempts that succeeded / failed
--   challan_success / challan_failed — Challan API attempts that succeeded / failed
-- A single user flow can increment multiple cells (e.g. primary RC fail + fallback RC fail + challan fail = 3 failed steps).
--
-- RLS disabled for now (same pattern as employee_verification_api_calls).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'vehicle_verification_api_calls'
  ) THEN
    CREATE TABLE public.vehicle_verification_api_calls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

      client_id uuid NOT NULL,
      -- Nullable: vehicles.employee_id can be null
      employee_id uuid,
      vehicle_id uuid NOT NULL,

      -- Primary integration name (e.g. quickekyc); align with edge function constants
      provider text NOT NULL DEFAULT 'quickekyc',
      is_multiple boolean NOT NULL DEFAULT false,
      -- Last provider that ran / won for current flow (e.g. quickekyc | surepass)
      current_provider text,

      -- RC API attempt totals
      rc_success integer NOT NULL DEFAULT 0,
      rc_failed integer NOT NULL DEFAULT 0,

      -- Challan API attempt totals
      challan_success integer NOT NULL DEFAULT 0,
      challan_failed integer NOT NULL DEFAULT 0,

      -- Fallback-only cumulative counters (same shape as employee_verification_api_calls)
      other_provider_success_call jsonb NOT NULL DEFAULT '{}'::jsonb,
      other_provider_failed_call jsonb NOT NULL DEFAULT '{}'::jsonb,

      -- Array of events: { ts, provider, role, operation, result, ... }
      -- operation: 'rc' | 'challan'
      audit_log jsonb NOT NULL DEFAULT '[]'::jsonb,

      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),

      CONSTRAINT uq_vehicle_verification_api_calls_vehicle_id UNIQUE (vehicle_id)
    );

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'clients'
    ) THEN
      ALTER TABLE public.vehicle_verification_api_calls
        ADD CONSTRAINT fk_vehicle_verification_api_calls_client
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'employees'
    ) THEN
      ALTER TABLE public.vehicle_verification_api_calls
        ADD CONSTRAINT fk_vehicle_verification_api_calls_employee
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'vehicles'
    ) THEN
      ALTER TABLE public.vehicle_verification_api_calls
        ADD CONSTRAINT fk_vehicle_verification_api_calls_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_vvac_client_id ON public.vehicle_verification_api_calls (client_id);
    CREATE INDEX IF NOT EXISTS idx_vvac_employee_id ON public.vehicle_verification_api_calls (employee_id);

    ALTER TABLE public.vehicle_verification_api_calls DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

COMMENT ON TABLE public.vehicle_verification_api_calls IS
  'Aggregated external API call metrics per vehicle: RC and challan, primary + fallback providers.';
