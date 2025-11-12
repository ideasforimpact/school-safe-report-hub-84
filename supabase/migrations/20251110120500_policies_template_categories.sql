-- RLS Policies for template_categories table
-- Enable RLS and create policies for template_categories table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'template_categories'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

    -- Policy: Anyone can view template categories
    DROP POLICY IF EXISTS "Anyone can view template categories" ON public.template_categories;
    BEGIN
      CREATE POLICY "Anyone can view template categories" ON public.template_categories
      FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Authenticated users can view template categories
    DROP POLICY IF EXISTS "Authenticated users can view template categories" ON public.template_categories;
    BEGIN
      CREATE POLICY "Authenticated users can view template categories" ON public.template_categories
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage template categories
    DROP POLICY IF EXISTS "Backoffice admins can manage template categories" ON public.template_categories;
    BEGIN
      CREATE POLICY "Backoffice admins can manage template categories" ON public.template_categories
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

