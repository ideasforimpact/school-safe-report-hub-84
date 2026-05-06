-- Fix incident_categories RLS to honor switched client context.
-- Old policy used employees.user_id only (home client), which blocks switched target client rows.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'incident_categories'
  ) THEN
    ALTER TABLE public.incident_categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view categories for their client" ON public.incident_categories;
    DROP POLICY IF EXISTS "Users can create categories for their client" ON public.incident_categories;
    DROP POLICY IF EXISTS "Users can update categories for their client" ON public.incident_categories;
    DROP POLICY IF EXISTS "Users can delete incident categories from their client" ON public.incident_categories;

    CREATE POLICY "Users can view categories for their client" ON public.incident_categories
    FOR SELECT USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    CREATE POLICY "Users can create categories for their client" ON public.incident_categories
    FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    CREATE POLICY "Users can update categories for their client" ON public.incident_categories
    FOR UPDATE USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );

    CREATE POLICY "Users can delete incident categories from their client" ON public.incident_categories
    FOR DELETE USING (
      auth.uid() IS NOT NULL
      AND (
        client_id = public.get_current_user_client_id()
        OR public.is_current_user_backoffice_admin() = true
      )
    );
  END IF;
END $$;
