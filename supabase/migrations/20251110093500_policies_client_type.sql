-- RLS Policies for client_type table
-- Enable RLS and create all policies matching production

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_type'
  ) THEN
    -- Enable RLS
      ALTER TABLE public.client_type ENABLE ROW LEVEL SECURITY;

    -- Policy: Authenticated users can view client types
    DROP POLICY IF EXISTS "Authenticated users can view client types" ON public.client_type;
    BEGIN
      CREATE POLICY "Authenticated users can view client types" ON public.client_type
      FOR SELECT USING (auth.uid() IS NOT NULL);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Backoffice admins can manage client types
    DROP POLICY IF EXISTS "Backoffice admins can manage client types" ON public.client_type;
    BEGIN
      CREATE POLICY "Backoffice admins can manage client types" ON public.client_type
      USING (public.is_current_user_backoffice_admin() = true)
      WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


