-- Create incidents table (idempotent)
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ticket_id text NOT NULL,
  type_id uuid,
  category_id uuid,
  subcategory_id uuid,
  description text,
  date timestamptz NOT NULL,
  location_id uuid,
  people_involved jsonb DEFAULT '[]'::jsonb NOT NULL,
  status_id uuid NOT NULL,
  priority_id uuid,
  facility_id uuid,
  created_by uuid NOT NULL,
  assigned_to uuid,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  client_id uuid,
  root_cause_analysis text,
  action_taken text,
  contributing_factor jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  reopen integer DEFAULT 0 NOT NULL,
  learning_points text,
  recommended_action jsonb
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='incidents_pkey'
  ) THEN
    ALTER TABLE public.incidents ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents (assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_category_id ON public.incidents (category_id);
CREATE INDEX IF NOT EXISTS idx_incidents_client_created ON public.incidents (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_client_id ON public.incidents (client_id);
CREATE INDEX IF NOT EXISTS idx_incidents_client_status ON public.incidents (client_id, status_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_created_by ON public.incidents (created_by);
CREATE INDEX IF NOT EXISTS idx_incidents_location_id ON public.incidents (location_id);
CREATE INDEX IF NOT EXISTS idx_incidents_priority_id ON public.incidents (priority_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status_id ON public.incidents (status_id);
CREATE INDEX IF NOT EXISTS idx_incidents_type_id ON public.incidents (type_id);

-- FKs guarded by existence of referenced tables
-- Production has 10 FKs for incidents table
DO $$
BEGIN
  -- 1. incidents_created_by_fkey
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_created_by_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- 2. incidents_assigned_to_fkey
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_assigned_to_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- 3. incidents_client_id_fkey
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_client_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- 4. incidents_category_id_fkey (MISSING)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_categories')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_category_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.incident_categories(id) ON DELETE CASCADE;
  END IF;

  -- 5. incidents_subcategory_id_fkey (MISSING)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_subcategories')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_subcategory_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_subcategory_id_fkey
      FOREIGN KEY (subcategory_id) REFERENCES public.incident_subcategories(id) ON DELETE CASCADE;
  END IF;

  -- 6. incidents_type_id_fkey (MISSING)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_report_types')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_type_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_type_id_fkey
      FOREIGN KEY (type_id) REFERENCES public.incident_report_types(id) ON DELETE CASCADE;
  END IF;

  -- 7. incidents_priority_id_fkey (MISSING)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_priorities')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_priority_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_priority_id_fkey
      FOREIGN KEY (priority_id) REFERENCES public.incident_priorities(id) ON DELETE CASCADE;
  END IF;

  -- 8. incidents_location_id_fkey (MISSING)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campuses')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_location_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES public.campuses(id) ON DELETE CASCADE;
  END IF;

  -- 9. incidents_facility_id_fkey (MISSING)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='facilities')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incidents_facility_id_fkey') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_facility_id_fkey
      FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;
  END IF;

  -- 10. fk_incident_status (MISSING - status_id -> incident_status)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_status')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_incident_status') THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT fk_incident_status
      FOREIGN KEY (status_id) REFERENCES public.incident_status(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Comments (optional, idempotent)
DO $$
BEGIN
  BEGIN
    COMMENT ON COLUMN public.incidents.comments IS 'Stores incident comments as JSON array';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    COMMENT ON COLUMN public.incidents.reopen IS 'Tracks how many times an incident has been reopened. Default 0 means never reopened.';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


