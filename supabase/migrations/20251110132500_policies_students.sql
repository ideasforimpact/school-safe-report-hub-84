-- RLS Policies for students table
-- Enable RLS and create policies for students table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'students'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view students from their client
    DROP POLICY IF EXISTS "Users can view students from their client" ON public.students;
    BEGIN
      CREATE POLICY "Users can view students from their client" ON public.students
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert students for their client
    DROP POLICY IF EXISTS "Users can insert students for their client" ON public.students;
    BEGIN
      CREATE POLICY "Users can insert students for their client" ON public.students
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update students from their client
    DROP POLICY IF EXISTS "Users can update students from their client" ON public.students;
    BEGIN
      CREATE POLICY "Users can update students from their client" ON public.students
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete students from their client
    DROP POLICY IF EXISTS "Users can delete students from their client" ON public.students;
    BEGIN
      CREATE POLICY "Users can delete students from their client" ON public.students
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

