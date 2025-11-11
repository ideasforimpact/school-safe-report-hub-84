-- RLS Policies for edusafe_resources table
-- Enable RLS and create policies for edusafe_resources table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'edusafe_resources'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.edusafe_resources ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view edusafe resources from their client
    DROP POLICY IF EXISTS "Users can view edusafe resources from their client" ON public.edusafe_resources;
    BEGIN
      CREATE POLICY "Users can view edusafe resources from their client" ON public.edusafe_resources
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert edusafe resources for their client
    DROP POLICY IF EXISTS "Users can insert edusafe resources for their client" ON public.edusafe_resources;
    BEGIN
      CREATE POLICY "Users can insert edusafe resources for their client" ON public.edusafe_resources
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update edusafe resources from their client
    DROP POLICY IF EXISTS "Users can update edusafe resources from their client" ON public.edusafe_resources;
    BEGIN
      CREATE POLICY "Users can update edusafe resources from their client" ON public.edusafe_resources
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete edusafe resources from their client
    DROP POLICY IF EXISTS "Users can delete edusafe resources from their client" ON public.edusafe_resources;
    BEGIN
      CREATE POLICY "Users can delete edusafe resources from their client" ON public.edusafe_resources
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

