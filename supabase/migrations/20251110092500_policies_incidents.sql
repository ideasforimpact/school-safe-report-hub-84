-- RLS Policies for incidents table
-- Enable RLS and create all policies matching production

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incidents'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Anyone can view incidents
    DROP POLICY IF EXISTS "Anyone can view incidents" ON public.incidents;
    BEGIN
      CREATE POLICY "Anyone can view incidents" ON public.incidents
      FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Authenticated users can create incidents
    DROP POLICY IF EXISTS "Authenticated users can create incidents" ON public.incidents;
    BEGIN
      CREATE POLICY "Authenticated users can create incidents" ON public.incidents
      FOR INSERT TO authenticated WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Authenticated users can update incidents
    DROP POLICY IF EXISTS "Authenticated users can update incidents" ON public.incidents;
    BEGIN
      CREATE POLICY "Authenticated users can update incidents" ON public.incidents
      FOR UPDATE TO authenticated USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can delete incidents they created in their client
    DROP POLICY IF EXISTS "Users can delete incidents they created in their client" ON public.incidents;
    BEGIN
      CREATE POLICY "Users can delete incidents they created in their client" ON public.incidents
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          (client_id = public.get_current_user_client_id() AND created_by = auth.uid()) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can insert incidents for their client
    DROP POLICY IF EXISTS "Users can insert incidents for their client" ON public.incidents;
    BEGIN
      CREATE POLICY "Users can insert incidents for their client" ON public.incidents
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Users can update incidents from their client involvement
    DROP POLICY IF EXISTS "Users can update incidents from their client involvement" ON public.incidents;
    BEGIN
      CREATE POLICY "Users can update incidents from their client involvement" ON public.incidents
      FOR UPDATE USING (
        (auth.uid() IS NOT NULL) AND (
          ((client_id = public.get_current_user_client_id()) AND ((created_by = auth.uid()) OR (assigned_to = auth.uid()))) 
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 7: Users can view incidents from their client or involvement
    DROP POLICY IF EXISTS "Users can view incidents from their client or involvement" ON public.incidents;
    BEGIN
      CREATE POLICY "Users can view incidents from their client or involvement" ON public.incidents
      FOR SELECT USING (
        (auth.uid() IS NOT NULL) AND (
          (client_id = public.get_current_user_client_id()) 
          OR (created_by = auth.uid()) 
          OR (assigned_to = auth.uid()) 
          OR (public.is_current_user_backoffice_admin() = true)
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


