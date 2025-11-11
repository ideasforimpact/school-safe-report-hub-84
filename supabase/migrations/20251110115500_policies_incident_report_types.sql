-- RLS Policies for incident_report_types table
-- Enable RLS and create policies for incident_report_types table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_report_types'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.incident_report_types ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view incident report types from their client
    DROP POLICY IF EXISTS "Users can view incident report types from their client" ON public.incident_report_types;
    BEGIN
      CREATE POLICY "Users can view incident report types from their client" ON public.incident_report_types
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert incident report types for their client
    DROP POLICY IF EXISTS "Users can insert incident report types for their client" ON public.incident_report_types;
    BEGIN
      CREATE POLICY "Users can insert incident report types for their client" ON public.incident_report_types
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update incident report types from their client
    DROP POLICY IF EXISTS "Users can update incident report types from their client" ON public.incident_report_types;
    BEGIN
      CREATE POLICY "Users can update incident report types from their client" ON public.incident_report_types
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete incident report types from their client
    DROP POLICY IF EXISTS "Users can delete incident report types from their client" ON public.incident_report_types;
    BEGIN
      CREATE POLICY "Users can delete incident report types from their client" ON public.incident_report_types
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

