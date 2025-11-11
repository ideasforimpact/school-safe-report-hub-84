-- RLS Policies for backoffice_edusafe_resource table
-- Enable RLS and create ALL policies from migrations_copy (matching production exactly)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_edusafe_resource'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.backoffice_edusafe_resource ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Backoffice admins can manage backoffice edusafe resources (from 20250804124452)
    DROP POLICY IF EXISTS "Backoffice admins can manage backoffice edusafe resources" ON public.backoffice_edusafe_resource;
    BEGIN
      CREATE POLICY "Backoffice admins can manage backoffice edusafe resources" ON public.backoffice_edusafe_resource
      FOR ALL 
      USING (is_current_user_backoffice_admin() = true)
      WITH CHECK (is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Backoffice admins can view all backoffice edusafe resources
    DROP POLICY IF EXISTS "Backoffice admins can view all backoffice edusafe resources" ON public.backoffice_edusafe_resource;
    BEGIN
      CREATE POLICY "Backoffice admins can view all backoffice edusafe resources" ON public.backoffice_edusafe_resource
      FOR SELECT USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Backoffice admins can insert backoffice edusafe resources
    DROP POLICY IF EXISTS "Backoffice admins can insert backoffice edusafe resources" ON public.backoffice_edusafe_resource;
    BEGIN
      CREATE POLICY "Backoffice admins can insert backoffice edusafe resources" ON public.backoffice_edusafe_resource
      FOR INSERT WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Backoffice admins can update backoffice edusafe resources
    DROP POLICY IF EXISTS "Backoffice admins can update backoffice edusafe resources" ON public.backoffice_edusafe_resource;
    BEGIN
      CREATE POLICY "Backoffice admins can update backoffice edusafe resources" ON public.backoffice_edusafe_resource
      FOR UPDATE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Backoffice admins can delete backoffice edusafe resources
    DROP POLICY IF EXISTS "Backoffice admins can delete backoffice edusafe resources" ON public.backoffice_edusafe_resource;
    BEGIN
      CREATE POLICY "Backoffice admins can delete backoffice edusafe resources" ON public.backoffice_edusafe_resource
      FOR DELETE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

