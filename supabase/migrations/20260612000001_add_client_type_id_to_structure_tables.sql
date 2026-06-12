-- Add client_type_id to campuses, grades, sections, facilities
-- so structure data can be scoped per client type.

DO $$ BEGIN

  -- campuses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'campuses' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.campuses
      ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;

  -- grades
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'grades' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.grades
      ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;

  -- sections
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sections' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.sections
      ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;

  -- facilities
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'facilities' AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.facilities
      ADD COLUMN client_type_id uuid REFERENCES public.client_type(id);
  END IF;

END $$;

-- Backfill NULL client_type_id from the client's own type
UPDATE public.campuses   c SET client_type_id = cl.client_type_id FROM public.clients cl WHERE c.client_id  = cl.id AND c.client_type_id  IS NULL;
UPDATE public.grades     g SET client_type_id = cl.client_type_id FROM public.clients cl WHERE g.client_id  = cl.id AND g.client_type_id  IS NULL;
UPDATE public.sections   s SET client_type_id = cl.client_type_id FROM public.clients cl WHERE s.client_id  = cl.id AND s.client_type_id  IS NULL;
UPDATE public.facilities f SET client_type_id = cl.client_type_id FROM public.clients cl WHERE f.client_id  = cl.id AND f.client_type_id  IS NULL;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_campuses_client_type   ON public.campuses   (client_id, client_type_id);
CREATE INDEX IF NOT EXISTS idx_grades_client_type     ON public.grades     (client_id, client_type_id);
CREATE INDEX IF NOT EXISTS idx_sections_client_type   ON public.sections   (client_id, client_type_id);
CREATE INDEX IF NOT EXISTS idx_facilities_client_type ON public.facilities (client_id, client_type_id);
