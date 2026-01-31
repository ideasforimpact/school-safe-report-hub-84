-- Create consultation_mode table and insert default values
-- Used for Student Well-Being consultation mode options

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'consultation_mode'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.consultation_mode (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT consultation_mode_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.consultation_mode IS 'Stores consultation mode options (In-person, Phone, Online)';

    -- Insert default values (from consultation mode dropdown)
    INSERT INTO public.consultation_mode (name, active) VALUES
      ('In-person', true),
      ('Phone', true),
      ('Online', true);
  END IF;
END $$;

-- Enable RLS and create policies (same pattern as incident_status)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'consultation_mode'
  ) THEN
    ALTER TABLE public.consultation_mode ENABLE ROW LEVEL SECURITY;

    -- Policy: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.consultation_mode;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.consultation_mode
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Authenticated users can view
    DROP POLICY IF EXISTS "Authenticated users can view consultation mode" ON public.consultation_mode;
    BEGIN
      CREATE POLICY "Authenticated users can view consultation mode" ON public.consultation_mode
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage
    DROP POLICY IF EXISTS "Backoffice admins can manage consultation mode" ON public.consultation_mode;
    BEGIN
      CREATE POLICY "Backoffice admins can manage consultation mode" ON public.consultation_mode
      FOR ALL USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
