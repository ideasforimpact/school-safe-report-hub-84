-- RLS Policies for vehicles table
-- Enable RLS and create policies for vehicles table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicles'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view vehicles from their client
    DROP POLICY IF EXISTS "Users can view vehicles from their client" ON public.vehicles;
    BEGIN
      CREATE POLICY "Users can view vehicles from their client" ON public.vehicles
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert vehicles for their client
    DROP POLICY IF EXISTS "Users can insert vehicles for their client" ON public.vehicles;
    BEGIN
      CREATE POLICY "Users can insert vehicles for their client" ON public.vehicles
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update vehicles from their client
    DROP POLICY IF EXISTS "Users can update vehicles from their client" ON public.vehicles;
    BEGIN
      CREATE POLICY "Users can update vehicles from their client" ON public.vehicles
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete vehicles from their client
    DROP POLICY IF EXISTS "Users can delete vehicles from their client" ON public.vehicles;
    BEGIN
      CREATE POLICY "Users can delete vehicles from their client" ON public.vehicles
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

