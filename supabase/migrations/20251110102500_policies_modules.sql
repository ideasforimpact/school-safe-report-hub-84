-- RLS Policies for modules table
-- Enable RLS and create policies for modules table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

    -- Policy: Authenticated users and backoffice admins can view modules
    DROP POLICY IF EXISTS "Authenticated users and backoffice admins can view modules" ON public.modules;
    BEGIN
      CREATE POLICY "Authenticated users and backoffice admins can view modules" ON public.modules
      FOR SELECT USING (
        (auth.role() = 'authenticated'::text) 
        OR public.is_backoffice_admin()
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can create modules
    DROP POLICY IF EXISTS "Backoffice admins can create modules" ON public.modules;
    BEGIN
      CREATE POLICY "Backoffice admins can create modules" ON public.modules
      FOR INSERT WITH CHECK (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can update modules
    DROP POLICY IF EXISTS "Backoffice admins can update modules" ON public.modules;
    BEGIN
      CREATE POLICY "Backoffice admins can update modules" ON public.modules
      FOR UPDATE USING (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can delete modules
    DROP POLICY IF EXISTS "Backoffice admins can delete modules" ON public.modules;
    BEGIN
      CREATE POLICY "Backoffice admins can delete modules" ON public.modules
      FOR DELETE USING (public.is_backoffice_admin());
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

