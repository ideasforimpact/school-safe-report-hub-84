-- Create cpd_learning_category lookup table and seed values
-- RLS same pattern as cpd_domain / cpd_entries

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cpd_learning_category'
  ) THEN
    CREATE TABLE public.cpd_learning_category (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      display_order integer NOT NULL DEFAULT 0,
      active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT cpd_learning_category_pkey PRIMARY KEY (id),
      CONSTRAINT cpd_learning_category_name_unique UNIQUE (name)
    );

    COMMENT ON TABLE public.cpd_learning_category IS 'Lookup for CPD learning categories (Course, Workshop, etc.)';

    INSERT INTO public.cpd_learning_category (name, display_order, active) VALUES
      ('Course', 1, true),
      ('Workshop', 2, true),
      ('Seminar', 3, true),
      ('Webinar', 4, true),
      ('Conference', 5, true),
      ('Training Program', 6, true),
      ('Online Learning', 7, true),
      ('Self-Study', 8, true),
      ('Work-Based Learning', 9, true),
      ('Ethics / Compliance Training', 10, true);
  END IF;
END $$;

-- RLS for cpd_learning_category (same pattern as cpd_domain)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cpd_learning_category'
  ) THEN
    ALTER TABLE public.cpd_learning_category ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authentication function access" ON public.cpd_learning_category;
    CREATE POLICY "Allow authentication function access" ON public.cpd_learning_category
    FOR SELECT USING (
      current_setting('role'::text) = 'authenticated'::text
      OR current_setting('role'::text) = 'anon'::text
      OR current_setting('role'::text) = 'postgres'::text
    );

    DROP POLICY IF EXISTS "Authenticated users can view cpd_learning_category" ON public.cpd_learning_category;
    CREATE POLICY "Authenticated users can view cpd_learning_category" ON public.cpd_learning_category
    FOR SELECT USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Backoffice admins can manage cpd_learning_category" ON public.cpd_learning_category;
    CREATE POLICY "Backoffice admins can manage cpd_learning_category" ON public.cpd_learning_category
    FOR ALL USING (public.is_current_user_backoffice_admin() = true)
    WITH CHECK (public.is_current_user_backoffice_admin() = true);
  END IF;
END $$;
