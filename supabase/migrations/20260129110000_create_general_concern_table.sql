-- Create general_concern table and insert default values
-- Used for Student Well-Being Management concern types

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'general_concern'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.general_concern (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT general_concern_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.general_concern IS 'Stores general concern types for student well-being';

    -- Insert default values (from General Concern dropdown)
    INSERT INTO public.general_concern (name, active) VALUES
      ('Emotional Stress', true),
      ('Behavioral Change', true),
      ('Academic Pressure', true),
      ('Bullying-related', true),
      ('General Concern', true);
  END IF;
END $$;

-- Enable RLS and create policies (same pattern as incident_status / employee tables)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'general_concern'
  ) THEN
    ALTER TABLE public.general_concern ENABLE ROW LEVEL SECURITY;

    -- Policy: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.general_concern;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.general_concern
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Authenticated users can view
    DROP POLICY IF EXISTS "Authenticated users can view general concern" ON public.general_concern;
    BEGIN
      CREATE POLICY "Authenticated users can view general concern" ON public.general_concern
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage
    DROP POLICY IF EXISTS "Backoffice admins can manage general concern" ON public.general_concern;
    BEGIN
      CREATE POLICY "Backoffice admins can manage general concern" ON public.general_concern
      FOR ALL USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
