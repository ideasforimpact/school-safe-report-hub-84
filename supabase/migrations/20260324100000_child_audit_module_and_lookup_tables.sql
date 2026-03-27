-- Child Audit: lookup tables (defaults), RLS, and user-level module registration

-- -- 1) child_check_type
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_check_type'
--   ) THEN
--     CREATE TABLE public.child_check_type (
--       id uuid DEFAULT gen_random_uuid() NOT NULL,
--       name text NOT NULL,
--       active boolean DEFAULT true NOT NULL,
--       created_at timestamp with time zone DEFAULT now() NOT NULL,
--       updated_at timestamp with time zone DEFAULT now() NOT NULL,
--       CONSTRAINT child_check_type_pkey PRIMARY KEY (id)
--     );
--     COMMENT ON TABLE public.child_check_type IS 'Child Audit: check type (morning/evening/hostel entry-exit)';
--     INSERT INTO public.child_check_type (name, active) VALUES
--       ('Morning Entry', true),
--       ('Evening Exit', true),
--       ('Hostel Entry', true),
--       ('Hostel Exit', true);
--   END IF;
-- END $$;

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_check_type'
--   ) THEN
--     ALTER TABLE public.child_check_type ENABLE ROW LEVEL SECURITY;
--     DROP POLICY IF EXISTS "Allow authentication function access" ON public.child_check_type;
--     BEGIN
--       CREATE POLICY "Allow authentication function access" ON public.child_check_type
--       FOR SELECT USING (
--         current_setting('role'::text) = 'authenticated'::text
--         OR current_setting('role'::text) = 'anon'::text
--         OR current_setting('role'::text) = 'postgres'::text
--       );
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Authenticated users can view child check type" ON public.child_check_type;
--     BEGIN
--       CREATE POLICY "Authenticated users can view child check type" ON public.child_check_type
--       FOR SELECT USING (auth.uid() IS NOT NULL);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Backoffice admins can manage child check type" ON public.child_check_type;
--     BEGIN
--       CREATE POLICY "Backoffice admins can manage child check type" ON public.child_check_type
--       FOR ALL USING (public.is_current_user_backoffice_admin() = true)
--       WITH CHECK (public.is_current_user_backoffice_admin() = true);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--   END IF;
-- END $$;

-- -- 2) child_audit_physical_condition
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_physical_condition'
--   ) THEN
--     CREATE TABLE public.child_audit_physical_condition (
--       id uuid DEFAULT gen_random_uuid() NOT NULL,
--       name text NOT NULL,
--       active boolean DEFAULT true NOT NULL,
--       created_at timestamp with time zone DEFAULT now() NOT NULL,
--       updated_at timestamp with time zone DEFAULT now() NOT NULL,
--       CONSTRAINT child_audit_physical_condition_pkey PRIMARY KEY (id)
--     );
--     COMMENT ON TABLE public.child_audit_physical_condition IS 'Child Audit: physical condition options';
--     INSERT INTO public.child_audit_physical_condition (name, active) VALUES
--       ('No visible injury', true),
--       ('Scratch', true),
--       ('Bruise', true),
--       ('Swelling', true),
--       ('Bite mark', true),
--       ('Redness', true),
--       ('Bandage present', true);
--   END IF;
-- END $$;

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_physical_condition'
--   ) THEN
--     ALTER TABLE public.child_audit_physical_condition ENABLE ROW LEVEL SECURITY;
--     DROP POLICY IF EXISTS "Allow authentication function access" ON public.child_audit_physical_condition;
--     BEGIN
--       CREATE POLICY "Allow authentication function access" ON public.child_audit_physical_condition
--       FOR SELECT USING (
--         current_setting('role'::text) = 'authenticated'::text
--         OR current_setting('role'::text) = 'anon'::text
--         OR current_setting('role'::text) = 'postgres'::text
--       );
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Authenticated users can view child audit physical condition" ON public.child_audit_physical_condition;
--     BEGIN
--       CREATE POLICY "Authenticated users can view child audit physical condition" ON public.child_audit_physical_condition
--       FOR SELECT USING (auth.uid() IS NOT NULL);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Backoffice admins can manage child audit physical condition" ON public.child_audit_physical_condition;
--     BEGIN
--       CREATE POLICY "Backoffice admins can manage child audit physical condition" ON public.child_audit_physical_condition
--       FOR ALL USING (public.is_current_user_backoffice_admin() = true)
--       WITH CHECK (public.is_current_user_backoffice_admin() = true);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--   END IF;
-- END $$;

-- -- 3) child_audit_behaviour
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_behaviour'
--   ) THEN
--     CREATE TABLE public.child_audit_behaviour (
--       id uuid DEFAULT gen_random_uuid() NOT NULL,
--       name text NOT NULL,
--       active boolean DEFAULT true NOT NULL,
--       created_at timestamp with time zone DEFAULT now() NOT NULL,
--       updated_at timestamp with time zone DEFAULT now() NOT NULL,
--       CONSTRAINT child_audit_behaviour_pkey PRIMARY KEY (id)
--     );
--     COMMENT ON TABLE public.child_audit_behaviour IS 'Child Audit: behaviour descriptors';
--     INSERT INTO public.child_audit_behaviour (name, active) VALUES
--       ('Calm', true),
--       ('Anxious', true),
--       ('Aggressive', true),
--       ('Withdrawn', true),
--       ('Crying', true),
--       ('Hyperactive', true),
--       ('Sensory overload', true);
--   END IF;
-- END $$;

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_behaviour'
--   ) THEN
--     ALTER TABLE public.child_audit_behaviour ENABLE ROW LEVEL SECURITY;
--     DROP POLICY IF EXISTS "Allow authentication function access" ON public.child_audit_behaviour;
--     BEGIN
--       CREATE POLICY "Allow authentication function access" ON public.child_audit_behaviour
--       FOR SELECT USING (
--         current_setting('role'::text) = 'authenticated'::text
--         OR current_setting('role'::text) = 'anon'::text
--         OR current_setting('role'::text) = 'postgres'::text
--       );
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Authenticated users can view child audit behaviour" ON public.child_audit_behaviour;
--     BEGIN
--       CREATE POLICY "Authenticated users can view child audit behaviour" ON public.child_audit_behaviour
--       FOR SELECT USING (auth.uid() IS NOT NULL);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Backoffice admins can manage child audit behaviour" ON public.child_audit_behaviour;
--     BEGIN
--       CREATE POLICY "Backoffice admins can manage child audit behaviour" ON public.child_audit_behaviour
--       FOR ALL USING (public.is_current_user_backoffice_admin() = true)
--       WITH CHECK (public.is_current_user_backoffice_admin() = true);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--   END IF;
-- END $$;

-- -- 4) child_audit_meltdown (lookup row for form option)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_meltdown'
--   ) THEN
--     CREATE TABLE public.child_audit_meltdown (
--       id uuid DEFAULT gen_random_uuid() NOT NULL,
--       name text NOT NULL,
--       active boolean DEFAULT true NOT NULL,
--       created_at timestamp with time zone DEFAULT now() NOT NULL,
--       updated_at timestamp with time zone DEFAULT now() NOT NULL,
--       CONSTRAINT child_audit_meltdown_pkey PRIMARY KEY (id)
--     );
--     COMMENT ON TABLE public.child_audit_meltdown IS 'Child Audit: meltdown form options';
--     INSERT INTO public.child_audit_meltdown (name, active) VALUES
--       ('Meltdown occurred', true);
--   END IF;
-- END $$;

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_meltdown'
--   ) THEN
--     ALTER TABLE public.child_audit_meltdown ENABLE ROW LEVEL SECURITY;
--     DROP POLICY IF EXISTS "Allow authentication function access" ON public.child_audit_meltdown;
--     BEGIN
--       CREATE POLICY "Allow authentication function access" ON public.child_audit_meltdown
--       FOR SELECT USING (
--         current_setting('role'::text) = 'authenticated'::text
--         OR current_setting('role'::text) = 'anon'::text
--         OR current_setting('role'::text) = 'postgres'::text
--       );
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Authenticated users can view child audit meltdown" ON public.child_audit_meltdown;
--     BEGIN
--       CREATE POLICY "Authenticated users can view child audit meltdown" ON public.child_audit_meltdown
--       FOR SELECT USING (auth.uid() IS NOT NULL);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Backoffice admins can manage child audit meltdown" ON public.child_audit_meltdown;
--     BEGIN
--       CREATE POLICY "Backoffice admins can manage child audit meltdown" ON public.child_audit_meltdown
--       FOR ALL USING (public.is_current_user_backoffice_admin() = true)
--       WITH CHECK (public.is_current_user_backoffice_admin() = true);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--   END IF;
-- END $$;

-- -- 5) child_audit_aggression
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_aggression'
--   ) THEN
--     CREATE TABLE public.child_audit_aggression (
--       id uuid DEFAULT gen_random_uuid() NOT NULL,
--       name text NOT NULL,
--       active boolean DEFAULT true NOT NULL,
--       created_at timestamp with time zone DEFAULT now() NOT NULL,
--       updated_at timestamp with time zone DEFAULT now() NOT NULL,
--       CONSTRAINT child_audit_aggression_pkey PRIMARY KEY (id)
--     );
--     COMMENT ON TABLE public.child_audit_aggression IS 'Child Audit: aggression types / directions';
--     INSERT INTO public.child_audit_aggression (name, active) VALUES
--       ('Toward self', true),
--       ('Toward staff', true),
--       ('Biting', true),
--       ('Toward peers', true),
--       ('Throwing objects', true),
--       ('Hitting', true);
--   END IF;
-- END $$;

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'child_audit_aggression'
--   ) THEN
--     ALTER TABLE public.child_audit_aggression ENABLE ROW LEVEL SECURITY;
--     DROP POLICY IF EXISTS "Allow authentication function access" ON public.child_audit_aggression;
--     BEGIN
--       CREATE POLICY "Allow authentication function access" ON public.child_audit_aggression
--       FOR SELECT USING (
--         current_setting('role'::text) = 'authenticated'::text
--         OR current_setting('role'::text) = 'anon'::text
--         OR current_setting('role'::text) = 'postgres'::text
--       );
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Authenticated users can view child audit aggression" ON public.child_audit_aggression;
--     BEGIN
--       CREATE POLICY "Authenticated users can view child audit aggression" ON public.child_audit_aggression
--       FOR SELECT USING (auth.uid() IS NOT NULL);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--     DROP POLICY IF EXISTS "Backoffice admins can manage child audit aggression" ON public.child_audit_aggression;
--     BEGIN
--       CREATE POLICY "Backoffice admins can manage child audit aggression" ON public.child_audit_aggression
--       FOR ALL USING (public.is_current_user_backoffice_admin() = true)
--       WITH CHECK (public.is_current_user_backoffice_admin() = true);
--     EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
--   END IF;
-- END $$;

-- 6) Register user-level module
DO $$
DECLARE
  existing_count integer;
  max_order integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.modules
    WHERE level = 'user' AND name = 'Child Audit';

    IF existing_count = 0 THEN
      SELECT COALESCE(MAX("order"), 0) + 1 INTO max_order
      FROM public.modules
      WHERE level = 'user';

      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'Child Audit',
        'user',
        'ClipboardList',
        NOW(),
        NOW(),
        max_order,
        '/child-audit',
        true
      );
      RAISE NOTICE 'Child Audit module inserted at order %', max_order;
    ELSE
      RAISE NOTICE 'Child Audit module already exists, skipping insertion';
    END IF;
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping Child Audit module insertion';
  END IF;
END $$;
