-- RLS Policies for facilities table
-- Enable RLS and create policies for facilities table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'facilities'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view facilities from their client
    DROP POLICY IF EXISTS "Users can view facilities from their client" ON public.facilities;
    BEGIN
      CREATE POLICY "Users can view facilities from their client" ON public.facilities
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert facilities for their client
    DROP POLICY IF EXISTS "Users can insert facilities for their client" ON public.facilities;
    BEGIN
      CREATE POLICY "Users can insert facilities for their client" ON public.facilities
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update facilities from their client
    DROP POLICY IF EXISTS "Users can update facilities from their client" ON public.facilities;
    BEGIN
      CREATE POLICY "Users can update facilities from their client" ON public.facilities
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete facilities from their client
    DROP POLICY IF EXISTS "Users can delete facilities from their client" ON public.facilities;
    BEGIN
      CREATE POLICY "Users can delete facilities from their client" ON public.facilities
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

