-- RLS Policies for vehicle_challans table
-- Enable RLS and create policies for vehicle_challans table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicle_challans'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.vehicle_challans ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view vehicle_challans from their client
    DROP POLICY IF EXISTS "Users can view vehicle_challans from their client" ON public.vehicle_challans;
    BEGIN
      CREATE POLICY "Users can view vehicle_challans from their client" ON public.vehicle_challans
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.vehicles v
            WHERE v.id = vehicle_challans.vehicle_id
            AND (
              v.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert vehicle_challans for their client
    DROP POLICY IF EXISTS "Users can insert vehicle_challans for their client" ON public.vehicle_challans;
    BEGIN
      CREATE POLICY "Users can insert vehicle_challans for their client" ON public.vehicle_challans
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.vehicles v
            WHERE v.id = vehicle_challans.vehicle_id
            AND (
              v.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update vehicle_challans from their client
    DROP POLICY IF EXISTS "Users can update vehicle_challans from their client" ON public.vehicle_challans;
    BEGIN
      CREATE POLICY "Users can update vehicle_challans from their client" ON public.vehicle_challans
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.vehicles v
            WHERE v.id = vehicle_challans.vehicle_id
            AND (
              v.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete vehicle_challans from their client
    DROP POLICY IF EXISTS "Users can delete vehicle_challans from their client" ON public.vehicle_challans;
    BEGIN
      CREATE POLICY "Users can delete vehicle_challans from their client" ON public.vehicle_challans
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.vehicles v
            WHERE v.id = vehicle_challans.vehicle_id
            AND (
              v.client_id = public.get_current_user_client_id() 
              OR public.is_current_user_backoffice_admin() = true
            )
          )
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    RAISE NOTICE 'RLS policies added for vehicle_challans table';
  ELSE
    RAISE NOTICE 'vehicle_challans table does not exist, skipping RLS policy creation';
  END IF;
END $$;

