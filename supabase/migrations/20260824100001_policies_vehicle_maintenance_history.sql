-- RLS Policies for vehicle_maintenance_history table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vehicle_maintenance_history'
  ) THEN
    ALTER TABLE public.vehicle_maintenance_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view vehicle maintenance history from their client" ON public.vehicle_maintenance_history;
    BEGIN
      CREATE POLICY "Users can view vehicle maintenance history from their client" ON public.vehicle_maintenance_history
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert vehicle maintenance history for their client" ON public.vehicle_maintenance_history;
    BEGIN
      CREATE POLICY "Users can insert vehicle maintenance history for their client" ON public.vehicle_maintenance_history
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update vehicle maintenance history from their client" ON public.vehicle_maintenance_history;
    BEGIN
      CREATE POLICY "Users can update vehicle maintenance history from their client" ON public.vehicle_maintenance_history
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete vehicle maintenance history from their client" ON public.vehicle_maintenance_history;
    BEGIN
      CREATE POLICY "Users can delete vehicle maintenance history from their client" ON public.vehicle_maintenance_history
      FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
