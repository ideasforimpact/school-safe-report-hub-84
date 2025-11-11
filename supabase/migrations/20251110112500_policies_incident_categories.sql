-- RLS Policies for incident_categories table
-- Enable RLS and create policies for incident_categories table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_categories'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.incident_categories ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view categories for their client
    DROP POLICY IF EXISTS "Users can view categories for their client" ON public.incident_categories;
    BEGIN
      CREATE POLICY "Users can view categories for their client" ON public.incident_categories
      FOR SELECT USING (
        client_id IN (
          SELECT employees.client_id FROM public.employees 
          WHERE employees.user_id = auth.uid()
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can create categories for their client
    DROP POLICY IF EXISTS "Users can create categories for their client" ON public.incident_categories;
    BEGIN
      CREATE POLICY "Users can create categories for their client" ON public.incident_categories
      FOR INSERT WITH CHECK (
        client_id IN (
          SELECT employees.client_id FROM public.employees 
          WHERE employees.user_id = auth.uid()
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can update categories for their client
    DROP POLICY IF EXISTS "Users can update categories for their client" ON public.incident_categories;
    BEGIN
      CREATE POLICY "Users can update categories for their client" ON public.incident_categories
      FOR UPDATE USING (
        client_id IN (
          SELECT employees.client_id FROM public.employees 
          WHERE employees.user_id = auth.uid()
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can delete incident categories from their client
    DROP POLICY IF EXISTS "Users can delete incident categories from their client" ON public.incident_categories;
    BEGIN
      CREATE POLICY "Users can delete incident categories from their client" ON public.incident_categories
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id IN (
            SELECT employees.client_id FROM public.employees 
            WHERE employees.user_id = auth.uid()
          ) 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

