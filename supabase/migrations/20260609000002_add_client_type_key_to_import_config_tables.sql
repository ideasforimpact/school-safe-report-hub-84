-- Adds client_type_key column to all import configuration tables so that each
-- row is tagged with the client type it belongs to (school | work | institute).
-- This allows all 3 types to be imported for every client upfront, and the app
-- filters by client_type_key based on the client's currently selected type.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_categories' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.incident_categories ADD COLUMN client_type_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_subcategories' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.incident_subcategories ADD COLUMN client_type_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contributing_factors' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.contributing_factors ADD COLUMN client_type_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_report_types' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.incident_report_types ADD COLUMN client_type_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_priorities' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.incident_priorities ADD COLUMN client_type_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_forms' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.custom_forms ADD COLUMN client_type_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessment_templates' AND column_name = 'client_type_key'
  ) THEN
    ALTER TABLE public.assessment_templates ADD COLUMN client_type_key text;
  END IF;
END $$;

-- Indexes for efficient filtering by client + type
CREATE INDEX IF NOT EXISTS idx_incident_categories_client_type_key
  ON public.incident_categories (client_id, client_type_key);

CREATE INDEX IF NOT EXISTS idx_contributing_factors_client_type_key
  ON public.contributing_factors (client_id, client_type_key);

CREATE INDEX IF NOT EXISTS idx_incident_report_types_client_type_key
  ON public.incident_report_types (client_id, client_type_key);

CREATE INDEX IF NOT EXISTS idx_incident_priorities_client_type_key
  ON public.incident_priorities (client_id, client_type_key);

CREATE INDEX IF NOT EXISTS idx_custom_forms_client_type_key
  ON public.custom_forms (client_id, client_type_key);

CREATE INDEX IF NOT EXISTS idx_assessment_templates_client_type_key
  ON public.assessment_templates (client_id, client_type_key);
