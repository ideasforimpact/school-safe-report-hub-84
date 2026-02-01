-- RLS Policies for sop_categories, sop, and sop_assigned tables
-- Enable RLS and create all policies following the employees table pattern

-- ============================================
-- RLS Policies for sop_categories table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop_categories'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.sop_categories;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.sop_categories
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view categories from their client or default categories
    DROP POLICY IF EXISTS "Users can view categories from their client or default" ON public.sop_categories;
    BEGIN
      CREATE POLICY "Users can view categories from their client or default" ON public.sop_categories
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR client_id IS NULL  -- Default categories
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert categories for their client only
    DROP POLICY IF EXISTS "Users can insert categories for their client only" ON public.sop_categories;
    BEGIN
      CREATE POLICY "Users can insert categories for their client only" ON public.sop_categories
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update categories from their client only
    DROP POLICY IF EXISTS "Users can update categories from their client only" ON public.sop_categories;
    BEGIN
      CREATE POLICY "Users can update categories from their client only" ON public.sop_categories
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete categories from their client only
    DROP POLICY IF EXISTS "Users can delete categories from their client only" ON public.sop_categories;
    BEGIN
      CREATE POLICY "Users can delete categories from their client only" ON public.sop_categories
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

-- ============================================
-- RLS Policies for sop table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.sop ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.sop;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.sop
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view SOPs from their client
    DROP POLICY IF EXISTS "Users can view SOPs from their client" ON public.sop;
    BEGIN
      CREATE POLICY "Users can view SOPs from their client" ON public.sop
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.sop_categories
            WHERE sop_categories.id = sop.category_id
            AND (
              sop_categories.client_id = public.get_current_user_client_id()
              OR sop_categories.client_id IS NULL  -- Default categories
            )
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert SOPs for their client only
    DROP POLICY IF EXISTS "Users can insert SOPs for their client only" ON public.sop;
    BEGIN
      CREATE POLICY "Users can insert SOPs for their client only" ON public.sop
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.sop_categories
            WHERE sop_categories.id = sop.category_id
            AND (
              sop_categories.client_id = public.get_current_user_client_id()
              OR sop_categories.client_id IS NULL  -- Default categories
            )
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update SOPs from their client only
    DROP POLICY IF EXISTS "Users can update SOPs from their client only" ON public.sop;
    BEGIN
      CREATE POLICY "Users can update SOPs from their client only" ON public.sop
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.sop_categories
            WHERE sop_categories.id = sop.category_id
            AND (
              sop_categories.client_id = public.get_current_user_client_id()
              OR sop_categories.client_id IS NULL  -- Default categories
            )
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete SOPs from their client only
    DROP POLICY IF EXISTS "Users can delete SOPs from their client only" ON public.sop;
    BEGIN
      CREATE POLICY "Users can delete SOPs from their client only" ON public.sop
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.sop_categories
            WHERE sop_categories.id = sop.category_id
            AND (
              sop_categories.client_id = public.get_current_user_client_id()
              OR sop_categories.client_id IS NULL  -- Default categories
            )
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- ============================================
-- RLS Policies for sop_assigned table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop_assigned'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.sop_assigned ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.sop_assigned;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.sop_assigned
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view assignments from their client
    DROP POLICY IF EXISTS "Users can view assignments from their client" ON public.sop_assigned;
    BEGIN
      CREATE POLICY "Users can view assignments from their client" ON public.sop_assigned
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_assigned.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert assignments for their client only
    DROP POLICY IF EXISTS "Users can insert assignments for their client only" ON public.sop_assigned;
    BEGIN
      CREATE POLICY "Users can insert assignments for their client only" ON public.sop_assigned
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_assigned.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update assignments from their client only
    DROP POLICY IF EXISTS "Users can update assignments from their client only" ON public.sop_assigned;
    BEGIN
      CREATE POLICY "Users can update assignments from their client only" ON public.sop_assigned
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_assigned.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete assignments from their client only
    DROP POLICY IF EXISTS "Users can delete assignments from their client only" ON public.sop_assigned;
    BEGIN
      CREATE POLICY "Users can delete assignments from their client only" ON public.sop_assigned
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_assigned.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

