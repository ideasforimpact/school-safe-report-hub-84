
-- Enable Row Level Security on contributing_factors table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contributing_factors') THEN
    ALTER TABLE public.contributing_factors ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to view contributing factors from their client and global factors
    DROP POLICY IF EXISTS "Users can view contributing factors from their client" ON public.contributing_factors;
    CREATE POLICY "Users can view contributing factors from their client"
    ON public.contributing_factors
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if contributing factor belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to view all contributing factors
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to insert contributing factors for their client
    DROP POLICY IF EXISTS "Users can insert contributing factors for their client" ON public.contributing_factors;
    CREATE POLICY "Users can insert contributing factors for their client"
    ON public.contributing_factors
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if contributing factor is being created for the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to insert contributing factors for any client
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to update contributing factors from their client
    DROP POLICY IF EXISTS "Users can update contributing factors from their client" ON public.contributing_factors;
    CREATE POLICY "Users can update contributing factors from their client"
    ON public.contributing_factors
    FOR UPDATE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if contributing factor belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to update any contributing factor
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to delete contributing factors from their client
    DROP POLICY IF EXISTS "Users can delete contributing factors from their client" ON public.contributing_factors;
    CREATE POLICY "Users can delete contributing factors from their client"
    ON public.contributing_factors
    FOR DELETE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if contributing factor belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to delete any contributing factor
        public.is_current_user_backoffice_admin() = true
      )
    );
  END IF;
END $$;
