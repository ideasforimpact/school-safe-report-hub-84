-- RLS Policies for roles table
-- Enable RLS and create policies for roles table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

    -- Policy: Authenticated users can view roles
    DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
    BEGIN
      CREATE POLICY "Authenticated users can view roles" ON public.roles
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage roles
    DROP POLICY IF EXISTS "Backoffice admins can manage roles" ON public.roles;
    BEGIN
      CREATE POLICY "Backoffice admins can manage roles" ON public.roles
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

