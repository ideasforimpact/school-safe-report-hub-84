-- Create vehicle_maintenance_history table
-- Tracks each period a vehicle spends in 'maintenance' status (started_at -> ended_at).
-- A vehicle may have multiple maintenance periods over its lifetime; ended_at is NULL
-- while the vehicle is currently in maintenance. `duration_days` (whole days) defaults to 0
-- when a period opens and is computed by the vehicles edge function when it closes.
--
-- Every object below is checked independently (not gated behind one "table already
-- exists" branch) so this migration self-heals a table that was created manually or
-- by a partially-failed earlier run, instead of silently skipping missing pieces.

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  vehicle_id uuid NOT NULL,
  client_id uuid,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  ended_at timestamp with time zone,
  duration_days integer DEFAULT 0 NOT NULL,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT vehicle_maintenance_history_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicle_maintenance_history' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE public.vehicle_maintenance_history ADD COLUMN duration_days integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_vehicle_maintenance_history_vehicle_id'
    AND table_schema = 'public'
    AND table_name = 'vehicle_maintenance_history'
  ) THEN
    ALTER TABLE public.vehicle_maintenance_history
    ADD CONSTRAINT fk_vehicle_maintenance_history_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicle_maintenance_history_client_id_fkey'
    AND table_schema = 'public'
    AND table_name = 'vehicle_maintenance_history'
  ) THEN
    ALTER TABLE public.vehicle_maintenance_history
    ADD CONSTRAINT vehicle_maintenance_history_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_history_vehicle_id
  ON public.vehicle_maintenance_history USING btree (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_history_started_at
  ON public.vehicle_maintenance_history USING btree (started_at DESC);

-- UNIQUE (not just an index): a vehicle can have at most one open (ended_at IS NULL)
-- maintenance period at a time. This makes duplicate "Ongoing" rows from a race
-- between two concurrent status updates a hard DB-level impossibility rather than
-- something the edge function has to get right on every call.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_maintenance_history_open_period
  ON public.vehicle_maintenance_history USING btree (vehicle_id) WHERE ended_at IS NULL;
