-- Migration: Replace client_type_key (text) with client_type_id (UUID FK) on all
-- import-configuration tables, backfill from existing client_type_key values, then
-- drop the old text column.

-- ── Add client_type_id column ────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_categories' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.incident_categories ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_subcategories' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.incident_subcategories ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contributing_factors' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.contributing_factors ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_report_types' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.incident_report_types ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_priorities' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.incident_priorities ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_forms' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.custom_forms ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessment_templates' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.assessment_templates ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;
END $$;


-- ── Backfill client_type_id from existing client_type_key text values ────────

UPDATE public.incident_categories ic
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = ic.client_type_key
AND    ic.client_type_id IS NULL;

UPDATE public.incident_subcategories sc
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = sc.client_type_key
AND    sc.client_type_id IS NULL;

UPDATE public.contributing_factors cf
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = cf.client_type_key
AND    cf.client_type_id IS NULL;

UPDATE public.incident_report_types rt
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = rt.client_type_key
AND    rt.client_type_id IS NULL;

UPDATE public.incident_priorities pr
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = pr.client_type_key
AND    pr.client_type_id IS NULL;

UPDATE public.custom_forms fo
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = fo.client_type_key
AND    fo.client_type_id IS NULL;

UPDATE public.assessment_templates at
SET    client_type_id = ct.id
FROM   public.client_type ct
WHERE  ct.key = at.client_type_key
AND    at.client_type_id IS NULL;


-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_incident_categories_client_type_id
  ON public.incident_categories (client_id, client_type_id);

CREATE INDEX IF NOT EXISTS idx_incident_subcategories_client_type_id
  ON public.incident_subcategories (client_id, client_type_id);

CREATE INDEX IF NOT EXISTS idx_contributing_factors_client_type_id
  ON public.contributing_factors (client_id, client_type_id);

CREATE INDEX IF NOT EXISTS idx_incident_report_types_client_type_id
  ON public.incident_report_types (client_id, client_type_id);

CREATE INDEX IF NOT EXISTS idx_incident_priorities_client_type_id
  ON public.incident_priorities (client_id, client_type_id);

CREATE INDEX IF NOT EXISTS idx_custom_forms_client_type_id
  ON public.custom_forms (client_id, client_type_id);

CREATE INDEX IF NOT EXISTS idx_assessment_templates_client_type_id
  ON public.assessment_templates (client_id, client_type_id);


-- ── Drop old client_type_key text columns ────────────────────────────────────

ALTER TABLE public.incident_categories     DROP COLUMN IF EXISTS client_type_key;
ALTER TABLE public.incident_subcategories  DROP COLUMN IF EXISTS client_type_key;
ALTER TABLE public.contributing_factors    DROP COLUMN IF EXISTS client_type_key;
ALTER TABLE public.incident_report_types   DROP COLUMN IF EXISTS client_type_key;
ALTER TABLE public.incident_priorities     DROP COLUMN IF EXISTS client_type_key;
ALTER TABLE public.custom_forms            DROP COLUMN IF EXISTS client_type_key;
ALTER TABLE public.assessment_templates    DROP COLUMN IF EXISTS client_type_key;
