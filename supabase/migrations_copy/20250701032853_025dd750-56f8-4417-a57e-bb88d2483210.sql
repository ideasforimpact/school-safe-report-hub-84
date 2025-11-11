
-- Enable Row Level Security on grades table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grades') THEN
    ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to view grades from their client
    DROP POLICY IF EXISTS "Users can view grades from their client" ON public.grades;
    CREATE POLICY "Users can view grades from their client"
    ON public.grades
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if grade belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to view all grades
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to insert grades for their client
    DROP POLICY IF EXISTS "Users can insert grades for their client" ON public.grades;
    CREATE POLICY "Users can insert grades for their client"
    ON public.grades
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if grade is being created for the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to insert grades for any client
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to update grades from their client
    DROP POLICY IF EXISTS "Users can update grades from their client" ON public.grades;
    CREATE POLICY "Users can update grades from their client"
    ON public.grades
    FOR UPDATE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if grade belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to update any grade
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to delete grades from their client
    DROP POLICY IF EXISTS "Users can delete grades from their client" ON public.grades;
    CREATE POLICY "Users can delete grades from their client"
    ON public.grades
    FOR DELETE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if grade belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to delete any grade
        public.is_current_user_backoffice_admin() = true
      )
    );
  END IF;
END $$;
