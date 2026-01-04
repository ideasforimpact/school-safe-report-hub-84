-- RLS Policies for incident_external_students table
-- Enable RLS and create policies for incident_external_students table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_external_students'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.incident_external_students ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view incident_external_students where incident belongs to their client
    DROP POLICY IF EXISTS "Users can view incident_external_students from their client" ON public.incident_external_students;
    BEGIN
      CREATE POLICY "Users can view incident_external_students from their client" ON public.incident_external_students
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.incidents 
            WHERE incidents.id = incident_external_students.incident_id 
            AND (
              incidents.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
          AND EXISTS (
            SELECT 1 FROM public.external_students 
            WHERE external_students.id = incident_external_students.external_student_id 
            AND (
              external_students.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert incident_external_students for incidents from their client
    DROP POLICY IF EXISTS "Users can insert incident_external_students for their client" ON public.incident_external_students;
    BEGIN
      CREATE POLICY "Users can insert incident_external_students for their client" ON public.incident_external_students
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.incidents 
            WHERE incidents.id = incident_external_students.incident_id 
            AND (
              incidents.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
          AND EXISTS (
            SELECT 1 FROM public.external_students 
            WHERE external_students.id = incident_external_students.external_student_id 
            AND (
              external_students.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update incident_external_students from their client
    DROP POLICY IF EXISTS "Users can update incident_external_students from their client" ON public.incident_external_students;
    BEGIN
      CREATE POLICY "Users can update incident_external_students from their client" ON public.incident_external_students
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.incidents 
            WHERE incidents.id = incident_external_students.incident_id 
            AND (
              incidents.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
          AND EXISTS (
            SELECT 1 FROM public.external_students 
            WHERE external_students.id = incident_external_students.external_student_id 
            AND (
              external_students.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete incident_external_students from their client
    DROP POLICY IF EXISTS "Users can delete incident_external_students from their client" ON public.incident_external_students;
    BEGIN
      CREATE POLICY "Users can delete incident_external_students from their client" ON public.incident_external_students
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.incidents 
            WHERE incidents.id = incident_external_students.incident_id 
            AND (
              incidents.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
          AND EXISTS (
            SELECT 1 FROM public.external_students 
            WHERE external_students.id = incident_external_students.external_student_id 
            AND (
              external_students.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    RAISE NOTICE 'Enabled RLS and created policies for incident_external_students table';
  ELSE
    RAISE NOTICE 'Table incident_external_students does not exist, skipping RLS policies';
  END IF;
END $$;

