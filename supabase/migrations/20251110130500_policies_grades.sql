-- RLS Policies for grades table
-- Enable RLS and create policies for grades table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'grades'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view grades from their client
    DROP POLICY IF EXISTS "Users can view grades from their client" ON public.grades;
    BEGIN
      CREATE POLICY "Users can view grades from their client" ON public.grades
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert grades for their client
    DROP POLICY IF EXISTS "Users can insert grades for their client" ON public.grades;
    BEGIN
      CREATE POLICY "Users can insert grades for their client" ON public.grades
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update grades from their client
    DROP POLICY IF EXISTS "Users can update grades from their client" ON public.grades;
    BEGIN
      CREATE POLICY "Users can update grades from their client" ON public.grades
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete grades from their client
    DROP POLICY IF EXISTS "Users can delete grades from their client" ON public.grades;
    BEGIN
      CREATE POLICY "Users can delete grades from their client" ON public.grades
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

