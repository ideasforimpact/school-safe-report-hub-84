-- RLS Policies for vehicle_documents table
-- Enable RLS and create policies for vehicle_documents table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicle_documents'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view vehicle documents from their client
    DROP POLICY IF EXISTS "Users can view vehicle documents from their client" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "Users can view vehicle documents from their client" ON public.vehicle_documents
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          vehicle_id IN (
            SELECT v.id FROM public.vehicles v 
            WHERE v.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can insert vehicle documents for their client
    DROP POLICY IF EXISTS "Users can insert vehicle documents for their client" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "Users can insert vehicle documents for their client" ON public.vehicle_documents
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          vehicle_id IN (
            SELECT v.id FROM public.vehicles v 
            WHERE v.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update vehicle documents from their client
    DROP POLICY IF EXISTS "Users can update vehicle documents from their client" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "Users can update vehicle documents from their client" ON public.vehicle_documents
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          vehicle_id IN (
            SELECT v.id FROM public.vehicles v 
            WHERE v.client_id = public.get_current_user_client_id()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete vehicle documents from their client
    -- Production line 3467: Uses IN (SELECT v.id...)
    DROP POLICY IF EXISTS "Users can delete vehicle documents from their client" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "Users can delete vehicle documents from their client" ON public.vehicle_documents
      FOR DELETE USING ((auth.uid() IS NOT NULL) AND ((vehicle_id IN (SELECT v.id FROM public.vehicles v WHERE v.client_id = public.get_current_user_client_id())) OR (public.is_current_user_backoffice_admin() = true)));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Additional policies from production (lines 4006-4028): vehicle_documents_* policies using EXISTS
    -- Policy: vehicle_documents_delete
    DROP POLICY IF EXISTS "vehicle_documents_delete" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "vehicle_documents_delete" ON public.vehicle_documents
      FOR DELETE USING ((auth.uid() IS NOT NULL) AND ((EXISTS (SELECT 1 FROM public.vehicles v WHERE (v.id = vehicle_documents.vehicle_id) AND (v.client_id = public.get_current_user_client_id()))) OR (public.is_current_user_backoffice_admin() = true)));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: vehicle_documents_insert
    DROP POLICY IF EXISTS "vehicle_documents_insert" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "vehicle_documents_insert" ON public.vehicle_documents
      FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL) AND ((EXISTS (SELECT 1 FROM public.vehicles v WHERE (v.id = vehicle_documents.vehicle_id) AND (v.client_id = public.get_current_user_client_id()))) OR (public.is_current_user_backoffice_admin() = true)));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: vehicle_documents_select
    DROP POLICY IF EXISTS "vehicle_documents_select" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "vehicle_documents_select" ON public.vehicle_documents
      FOR SELECT USING ((auth.uid() IS NOT NULL) AND ((EXISTS (SELECT 1 FROM public.vehicles v WHERE (v.id = vehicle_documents.vehicle_id) AND (v.client_id = public.get_current_user_client_id()))) OR (public.is_current_user_backoffice_admin() = true)));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: vehicle_documents_update
    DROP POLICY IF EXISTS "vehicle_documents_update" ON public.vehicle_documents;
    BEGIN
      CREATE POLICY "vehicle_documents_update" ON public.vehicle_documents
      FOR UPDATE USING ((auth.uid() IS NOT NULL) AND ((EXISTS (SELECT 1 FROM public.vehicles v WHERE (v.id = vehicle_documents.vehicle_id) AND (v.client_id = public.get_current_user_client_id()))) OR (public.is_current_user_backoffice_admin() = true)))
      WITH CHECK ((auth.uid() IS NOT NULL) AND ((EXISTS (SELECT 1 FROM public.vehicles v WHERE (v.id = vehicle_documents.vehicle_id) AND (v.client_id = public.get_current_user_client_id()))) OR (public.is_current_user_backoffice_admin() = true)));
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

