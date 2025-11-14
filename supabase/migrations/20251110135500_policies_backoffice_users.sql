-- RLS Policies for backoffice_users table
-- Enable RLS and create ALL policies from migrations_copy (matching production exactly)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.backoffice_users ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow anonymous read for login verification (from 20250807043734)
    -- Production line 3104: TO "authenticated", "anon" (order matters)
    DROP POLICY IF EXISTS "Allow anonymous read for login verification" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Allow anonymous read for login verification" ON public.backoffice_users
      FOR SELECT 
      TO authenticated, anon
      USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view their own backoffice record (from 20250807043734)
    DROP POLICY IF EXISTS "Users can view their own backoffice record" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Users can view their own backoffice record" ON public.backoffice_users
      FOR SELECT 
      TO authenticated
      USING (auth.uid()::text = id::text);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Service role full access (from 20250807043734)
    DROP POLICY IF EXISTS "Service role full access" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Service role full access" ON public.backoffice_users
      FOR ALL 
      TO service_role
      USING (true)
      WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Service role can access backoffice users (from 20250807050804)
    -- Production line 3312: NO FOR ALL, just USING and WITH CHECK
    DROP POLICY IF EXISTS "Service role can access backoffice users" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Service role can access backoffice users" ON public.backoffice_users
      USING (auth.role() = 'service_role'::text)
      WITH CHECK (auth.role() = 'service_role'::text);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Backoffice admins can view all backoffice users
    DROP POLICY IF EXISTS "Backoffice admins can view all backoffice users" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Backoffice admins can view all backoffice users" ON public.backoffice_users
      FOR SELECT USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 6: Backoffice admins can insert backoffice users
    DROP POLICY IF EXISTS "Backoffice admins can insert backoffice users" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Backoffice admins can insert backoffice users" ON public.backoffice_users
      FOR INSERT WITH CHECK (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 7: Backoffice admins can update backoffice users
    DROP POLICY IF EXISTS "Backoffice admins can update backoffice users" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Backoffice admins can update backoffice users" ON public.backoffice_users
      FOR UPDATE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 8: Backoffice admins can delete backoffice users
    DROP POLICY IF EXISTS "Backoffice admins can delete backoffice users" ON public.backoffice_users;
    BEGIN
      CREATE POLICY "Backoffice admins can delete backoffice users" ON public.backoffice_users
      FOR DELETE USING (public.is_current_user_backoffice_admin() = true);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

