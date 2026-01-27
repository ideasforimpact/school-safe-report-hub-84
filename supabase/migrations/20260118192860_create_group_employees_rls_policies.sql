-- RLS Policies for group_employees table
-- Enable RLS and create all policies matching employees table pattern

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'group_employees'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.group_employees ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.group_employees;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.group_employees
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view group_employees from their client
    DROP POLICY IF EXISTS "Users can view group_employees from their client" ON public.group_employees;
    BEGIN
      CREATE POLICY "Users can view group_employees from their client" ON public.group_employees
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert group_employees for their client only
    DROP POLICY IF EXISTS "Users can insert group_employees for their client only" ON public.group_employees;
    BEGIN
      CREATE POLICY "Users can insert group_employees for their client only" ON public.group_employees
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update group_employees from their client only
    DROP POLICY IF EXISTS "Users can update group_employees from their client only" ON public.group_employees;
    BEGIN
      CREATE POLICY "Users can update group_employees from their client only" ON public.group_employees
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete group_employees from their client only
    DROP POLICY IF EXISTS "Users can delete group_employees from their client only" ON public.group_employees;
    BEGIN
      CREATE POLICY "Users can delete group_employees from their client only" ON public.group_employees
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


