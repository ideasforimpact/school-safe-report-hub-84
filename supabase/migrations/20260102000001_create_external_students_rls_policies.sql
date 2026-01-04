-- RLS Policies for external_students table
-- Enable RLS and create policies for external_students table (same as students table)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'external_students'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.external_students ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view external students from their client
    DROP POLICY IF EXISTS "Users can view external students from their client" ON public.external_students;
    BEGIN
      CREATE POLICY "Users can view external students from their client" ON public.external_students
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert external students for their client
    DROP POLICY IF EXISTS "Users can insert external students for their client" ON public.external_students;
    BEGIN
      CREATE POLICY "Users can insert external students for their client" ON public.external_students
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update external students from their client
    DROP POLICY IF EXISTS "Users can update external students from their client" ON public.external_students;
    BEGIN
      CREATE POLICY "Users can update external students from their client" ON public.external_students
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete external students from their client
    DROP POLICY IF EXISTS "Users can delete external students from their client" ON public.external_students;
    BEGIN
      CREATE POLICY "Users can delete external students from their client" ON public.external_students
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    RAISE NOTICE 'Enabled RLS and created policies for external_students table';
  ELSE
    RAISE NOTICE 'Table external_students does not exist, skipping RLS policies';
  END IF;
END $$;

