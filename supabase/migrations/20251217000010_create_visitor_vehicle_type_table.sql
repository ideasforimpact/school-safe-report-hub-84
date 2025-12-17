-- Create visitor_vehicle_type table for visitor vehicle categories
-- Idempotent and safe to rerun

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'visitor_vehicle_type'
  ) THEN
    CREATE TABLE public.visitor_vehicle_type (
      id         uuid DEFAULT gen_random_uuid() NOT NULL,
      name       text NOT NULL,
      key        text NOT NULL,
      active     boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT visitor_vehicle_type_pkey PRIMARY KEY (id),
      CONSTRAINT visitor_vehicle_type_key_unique UNIQUE (key)
    );
  END IF;
END $$;

-- Seed default vehicle types (idempotent)
INSERT INTO public.visitor_vehicle_type (name, key, active)
SELECT 'Two Wheeler', 'two_wheeler', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.visitor_vehicle_type WHERE key = 'two_wheeler'
);

INSERT INTO public.visitor_vehicle_type (name, key, active)
SELECT 'Four Wheeler', 'four_wheeler', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.visitor_vehicle_type WHERE key = 'four_wheeler'
);

INSERT INTO public.visitor_vehicle_type (name, key, active)
SELECT 'Walk In', 'walk_in', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.visitor_vehicle_type WHERE key = 'walk_in'
);

INSERT INTO public.visitor_vehicle_type (name, key, active)
SELECT 'Trusted Vehicles', 'trusted_vehicles', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.visitor_vehicle_type WHERE key = 'trusted_vehicles'
);

-- RLS Policies for visitor_vehicle_type table
-- Patterned after visitors table policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'visitor_vehicle_type'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.visitor_vehicle_type ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.visitor_vehicle_type;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.visitor_vehicle_type
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Any logged-in user can view visitor vehicle types
    DROP POLICY IF EXISTS "Users can view visitor vehicle types" ON public.visitor_vehicle_type;
    BEGIN
      CREATE POLICY "Users can view visitor vehicle types" ON public.visitor_vehicle_type
      FOR SELECT USING (
        auth.uid() IS NOT NULL
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Only backoffice admins can insert
    DROP POLICY IF EXISTS "Admins can insert visitor vehicle types" ON public.visitor_vehicle_type;
    BEGIN
      CREATE POLICY "Admins can insert visitor vehicle types" ON public.visitor_vehicle_type
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND public.is_current_user_backoffice_admin() = true
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Only backoffice admins can update
    DROP POLICY IF EXISTS "Admins can update visitor vehicle types" ON public.visitor_vehicle_type;
    BEGIN
      CREATE POLICY "Admins can update visitor vehicle types" ON public.visitor_vehicle_type
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND public.is_current_user_backoffice_admin() = true
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Only backoffice admins can delete
    DROP POLICY IF EXISTS "Admins can delete visitor vehicle types" ON public.visitor_vehicle_type;
    BEGIN
      CREATE POLICY "Admins can delete visitor vehicle types" ON public.visitor_vehicle_type
      FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND public.is_current_user_backoffice_admin() = true
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


