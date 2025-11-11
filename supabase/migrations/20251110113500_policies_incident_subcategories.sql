-- RLS Policies for incident_subcategories table
-- Enable RLS and create policies for incident_subcategories table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_subcategories'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.incident_subcategories ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view incident subcategories from their client
    DROP POLICY IF EXISTS "Users can view incident subcategories from their client" ON public.incident_subcategories;
    BEGIN
      CREATE POLICY "Users can view incident subcategories from their client" ON public.incident_subcategories
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert incident subcategories for their client
    DROP POLICY IF EXISTS "Users can insert incident subcategories for their client" ON public.incident_subcategories;
    BEGIN
      CREATE POLICY "Users can insert incident subcategories for their client" ON public.incident_subcategories
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update incident subcategories from their client
    DROP POLICY IF EXISTS "Users can update incident subcategories from their client" ON public.incident_subcategories;
    BEGIN
      CREATE POLICY "Users can update incident subcategories from their client" ON public.incident_subcategories
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete incident subcategories from their client
    DROP POLICY IF EXISTS "Users can delete incident subcategories from their client" ON public.incident_subcategories;
    BEGIN
      CREATE POLICY "Users can delete incident subcategories from their client" ON public.incident_subcategories
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

