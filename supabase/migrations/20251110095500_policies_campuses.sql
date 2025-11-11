-- RLS Policies for campuses table
-- Enable RLS and create policies for campuses table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'campuses'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view campuses from their client
    DROP POLICY IF EXISTS "Users can view campuses from their client" ON public.campuses;
    BEGIN
      CREATE POLICY "Users can view campuses from their client" ON public.campuses
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert campuses for their client
    DROP POLICY IF EXISTS "Users can insert campuses for their client" ON public.campuses;
    BEGIN
      CREATE POLICY "Users can insert campuses for their client" ON public.campuses
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update campuses from their client
    DROP POLICY IF EXISTS "Users can update campuses from their client" ON public.campuses;
    BEGIN
      CREATE POLICY "Users can update campuses from their client" ON public.campuses
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete campuses from their client
    DROP POLICY IF EXISTS "Users can delete campuses from their client" ON public.campuses;
    BEGIN
      CREATE POLICY "Users can delete campuses from their client" ON public.campuses
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

