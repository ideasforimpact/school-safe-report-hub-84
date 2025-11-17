-- RLS Policies for employees table
-- Enable RLS and create all policies matching production

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employees'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.employees;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.employees
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view their own employee record
    DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
    BEGIN
      CREATE POLICY "Users can view their own employee record" ON public.employees
      FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can view employees from their client
    DROP POLICY IF EXISTS "Users can view employees from their client" ON public.employees;
    BEGIN
      CREATE POLICY "Users can view employees from their client" ON public.employees
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can insert employees for their client only
    DROP POLICY IF EXISTS "Users can insert employees for their client only" ON public.employees;
BEGIN
      CREATE POLICY "Users can insert employees for their client only" ON public.employees
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can update employees from their client only
    DROP POLICY IF EXISTS "Users can update employees from their client only" ON public.employees;
    BEGIN
      CREATE POLICY "Users can update employees from their client only" ON public.employees
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Users can delete employees from their client only
    DROP POLICY IF EXISTS "Users can delete employees from their client only" ON public.employees;
    BEGIN
      CREATE POLICY "Users can delete employees from their client only" ON public.employees
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


