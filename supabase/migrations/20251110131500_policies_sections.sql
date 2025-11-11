-- RLS Policies for sections table
-- Enable RLS and create policies for sections table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sections'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view sections from their client
    DROP POLICY IF EXISTS "Users can view sections from their client" ON public.sections;
    BEGIN
      CREATE POLICY "Users can view sections from their client" ON public.sections
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert sections for their client
    DROP POLICY IF EXISTS "Users can insert sections for their client" ON public.sections;
    BEGIN
      CREATE POLICY "Users can insert sections for their client" ON public.sections
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update sections from their client
    DROP POLICY IF EXISTS "Users can update sections from their client" ON public.sections;
    BEGIN
      CREATE POLICY "Users can update sections from their client" ON public.sections
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete sections from their client
    DROP POLICY IF EXISTS "Users can delete sections from their client" ON public.sections;
    BEGIN
      CREATE POLICY "Users can delete sections from their client" ON public.sections
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

