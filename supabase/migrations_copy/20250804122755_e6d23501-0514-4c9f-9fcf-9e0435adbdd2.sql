-- Emergency security fix: Enable RLS on tables that have policies but RLS is disabled
-- This will activate the existing policies and prevent public data access
-- This migration is conditional to avoid errors if tables don't exist yet

DO $$
BEGIN
  -- Enable RLS on clients table (4 policies exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on incident_categories table (3 policies exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incident_categories') THEN
    ALTER TABLE public.incident_categories ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on incident_subcategories table (4 policies exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incident_subcategories') THEN
    ALTER TABLE public.incident_subcategories ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on modules table (4 policies exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;