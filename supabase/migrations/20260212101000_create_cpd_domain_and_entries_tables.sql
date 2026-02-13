-- Create cpd_domain and cpd_entries tables
-- cpd_domain stores CPD domains (e.g., Core Values & Ethics)
-- cpd_entries stores individual CPD records linked to employees and clients

DO $$
BEGIN
  -- Create cpd_domain table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cpd_domain'
  ) THEN
    CREATE TABLE public.cpd_domain (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      threshold integer NOT NULL,
      active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT cpd_domain_pkey PRIMARY KEY (id),
      CONSTRAINT cpd_domain_name_unique UNIQUE (name)
    );

    COMMENT ON TABLE public.cpd_domain IS 'Stores domains / headings for Continuing Professional Development';

    -- Insert default domain values (from CPD domain dropdown)
    INSERT INTO public.cpd_domain (name, threshold, active) VALUES
      ('Core Values & Ethics', 12 ,true),
      ('Knowledge & Practice', 24, true),
      ('Professional Growth & Development', 14, true);
  END IF;
END $$;

DO $$
BEGIN
  -- Enable RLS and create policies for cpd_domain
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cpd_domain'
  ) THEN
    ALTER TABLE public.cpd_domain ENABLE ROW LEVEL SECURITY;

    -- Policy: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.cpd_domain;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.cpd_domain
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Authenticated users can view
    DROP POLICY IF EXISTS "Authenticated users can view cpd_domain" ON public.cpd_domain;
    BEGIN
      CREATE POLICY "Authenticated users can view cpd_domain" ON public.cpd_domain
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage
    DROP POLICY IF EXISTS "Backoffice admins can manage cpd_domain" ON public.cpd_domain;
    BEGIN
      CREATE POLICY "Backoffice admins can manage cpd_domain" ON public.cpd_domain
      FOR ALL USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  -- Create cpd_entries table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cpd_entries'
  ) THEN
    CREATE TABLE public.cpd_entries (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      employee_id uuid,
      title text NOT NULL,
      domain_id uuid NOT NULL,
      category text NOT NULL,
      captured_date date NOT NULL,
      active boolean DEFAULT true NOT NULL,
      hour integer,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT cpd_entries_pkey PRIMARY KEY (id)
    );

    COMMENT ON TABLE public.cpd_entries IS 'Stores Continuing Professional Development entries for employees';

    -- FK to clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cpd_entries_client_id_fkey') THEN
        ALTER TABLE public.cpd_entries
          ADD CONSTRAINT cpd_entries_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- FK to employees
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cpd_entries_employee_id_fkey') THEN
        ALTER TABLE public.cpd_entries
          ADD CONSTRAINT cpd_entries_employee_id_fkey
          FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
      END IF;
    END IF;

    -- FK to cpd_domain
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpd_domain') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cpd_entries_domain_id_fkey') THEN
        ALTER TABLE public.cpd_entries
          ADD CONSTRAINT cpd_entries_domain_id_fkey
          FOREIGN KEY (domain_id) REFERENCES public.cpd_domain(id) ON DELETE RESTRICT;
      END IF;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_cpd_entries_client_id ON public.cpd_entries (client_id);
    CREATE INDEX IF NOT EXISTS idx_cpd_entries_employee_id ON public.cpd_entries (employee_id);
    CREATE INDEX IF NOT EXISTS idx_cpd_entries_domain_id ON public.cpd_entries (domain_id);
    CREATE INDEX IF NOT EXISTS idx_cpd_entries_active ON public.cpd_entries (active);
    CREATE INDEX IF NOT EXISTS idx_cpd_entries_created_at ON public.cpd_entries (created_at);
  END IF;
END $$;

-- Enable RLS for cpd_entries (same client-scoped pattern as student_well_begin_management)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cpd_entries'
  ) THEN
    ALTER TABLE public.cpd_entries ENABLE ROW LEVEL SECURITY;

    -- Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.cpd_entries;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.cpd_entries
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Users can view CPD entries from their client
    DROP POLICY IF EXISTS "Users can view cpd entries from their client" ON public.cpd_entries;
    BEGIN
      CREATE POLICY "Users can view cpd entries from their client" ON public.cpd_entries
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Users can insert CPD entries for their client only
    DROP POLICY IF EXISTS "Users can insert cpd entries for their client only" ON public.cpd_entries;
    BEGIN
      CREATE POLICY "Users can insert cpd entries for their client only" ON public.cpd_entries
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Users can update CPD entries from their client only
    DROP POLICY IF EXISTS "Users can update cpd entries from their client only" ON public.cpd_entries;
    BEGIN
      CREATE POLICY "Users can update cpd entries from their client only" ON public.cpd_entries
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Users can delete CPD entries from their client only
    DROP POLICY IF EXISTS "Users can delete cpd entries from their client only" ON public.cpd_entries;
    BEGIN
      CREATE POLICY "Users can delete cpd entries from their client only" ON public.cpd_entries
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

