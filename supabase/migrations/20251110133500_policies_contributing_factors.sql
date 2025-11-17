-- RLS Policies for contributing_factors table
-- Enable RLS and create policies for contributing_factors table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'contributing_factors'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.contributing_factors ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view contributing factors from their client
    DROP POLICY IF EXISTS "Users can view contributing factors from their client" ON public.contributing_factors;
    BEGIN
      CREATE POLICY "Users can view contributing factors from their client" ON public.contributing_factors
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert contributing factors for their client
    DROP POLICY IF EXISTS "Users can insert contributing factors for their client" ON public.contributing_factors;
    BEGIN
      CREATE POLICY "Users can insert contributing factors for their client" ON public.contributing_factors
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update contributing factors from their client
    DROP POLICY IF EXISTS "Users can update contributing factors from their client" ON public.contributing_factors;
    BEGIN
      CREATE POLICY "Users can update contributing factors from their client" ON public.contributing_factors
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete contributing factors from their client
    DROP POLICY IF EXISTS "Users can delete contributing factors from their client" ON public.contributing_factors;
    BEGIN
      CREATE POLICY "Users can delete contributing factors from their client" ON public.contributing_factors
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

