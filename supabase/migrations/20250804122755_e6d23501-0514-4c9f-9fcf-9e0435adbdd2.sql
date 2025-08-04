-- Emergency security fix: Enable RLS on tables that have policies but RLS is disabled
-- This will activate the existing policies and prevent public data access

-- Enable RLS on clients table (4 policies exist)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on incident_categories table (3 policies exist) 
ALTER TABLE public.incident_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on incident_subcategories table (4 policies exist)
ALTER TABLE public.incident_subcategories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on modules table (4 policies exist)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;