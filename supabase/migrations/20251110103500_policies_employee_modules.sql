-- RLS Policies for employee_modules table
-- Enable RLS and create policies for employee_modules table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_modules'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.employee_modules ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view employee modules from their client only
    DROP POLICY IF EXISTS "Users can view employee modules from their client only" ON public.employee_modules;
    BEGIN
      CREATE POLICY "Users can view employee modules from their client only" ON public.employee_modules
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT e.id FROM public.employees e 
            WHERE e.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert employee modules for their client only
    DROP POLICY IF EXISTS "Users can insert employee modules for their client only" ON public.employee_modules;
    BEGIN
      CREATE POLICY "Users can insert employee modules for their client only" ON public.employee_modules
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT e.id FROM public.employees e 
            WHERE e.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update employee modules from their client only
    DROP POLICY IF EXISTS "Users can update employee modules from their client only" ON public.employee_modules;
    BEGIN
      CREATE POLICY "Users can update employee modules from their client only" ON public.employee_modules
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT e.id FROM public.employees e 
            WHERE e.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete employee modules from their client only
    DROP POLICY IF EXISTS "Users can delete employee modules from their client only" ON public.employee_modules;
    BEGIN
      CREATE POLICY "Users can delete employee modules from their client only" ON public.employee_modules
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          employee_id IN (
            SELECT e.id FROM public.employees e 
            WHERE e.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

