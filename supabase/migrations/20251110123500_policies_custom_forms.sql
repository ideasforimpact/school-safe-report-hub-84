-- RLS Policies for custom_forms table
-- Enable RLS and create ALL policies from migrations_copy (matching production exactly)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'custom_forms'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Users can view custom forms from their client
    DROP POLICY IF EXISTS "Users can view custom forms from their client" ON public.custom_forms;
    BEGIN
      CREATE POLICY "Users can view custom forms from their client" ON public.custom_forms
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view custom forms from their client and public active forms (from 20250701025330)
    DROP POLICY IF EXISTS "Users can view custom forms from their client and public active forms" ON public.custom_forms;
    BEGIN
      CREATE POLICY "Users can view custom forms from their client and public active forms" ON public.custom_forms
      FOR SELECT USING (
        -- Allow public access to active forms (for public submissions)
        (is_active = true)
        OR
        -- Allow authenticated users to view forms from their client
        (auth.uid() IS NOT NULL AND client_id = public.get_current_user_client_id())
        OR
        -- Allow backoffice users to view all forms
        (auth.uid() IS NOT NULL AND public.is_current_user_backoffice_admin() = true)
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert custom forms for their client
    DROP POLICY IF EXISTS "Users can insert custom forms for their client" ON public.custom_forms;
    BEGIN
      CREATE POLICY "Users can insert custom forms for their client" ON public.custom_forms
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update custom forms from their client
    DROP POLICY IF EXISTS "Users can update custom forms from their client" ON public.custom_forms;
    BEGIN
      CREATE POLICY "Users can update custom forms from their client" ON public.custom_forms
      FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete custom forms from their client
    DROP POLICY IF EXISTS "Users can delete custom forms from their client" ON public.custom_forms;
    BEGIN
      CREATE POLICY "Users can delete custom forms from their client" ON public.custom_forms
      FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        (
          client_id = public.get_current_user_client_id() 
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

