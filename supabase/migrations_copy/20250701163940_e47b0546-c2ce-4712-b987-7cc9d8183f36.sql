
-- Enable Row Level Security on vehicles table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to view vehicles from their client
    DROP POLICY IF EXISTS "Users can view vehicles from their client" ON public.vehicles;
    CREATE POLICY "Users can view vehicles from their client"
    ON public.vehicles
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if vehicle belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to view all vehicles
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to insert vehicles for their client
    DROP POLICY IF EXISTS "Users can insert vehicles for their client" ON public.vehicles;
    CREATE POLICY "Users can insert vehicles for their client"
    ON public.vehicles
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if vehicle is being created for the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to insert vehicles for any client
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to update vehicles from their client
    DROP POLICY IF EXISTS "Users can update vehicles from their client" ON public.vehicles;
    CREATE POLICY "Users can update vehicles from their client"
    ON public.vehicles
    FOR UPDATE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if vehicle belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to update any vehicle
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to delete vehicles from their client
    DROP POLICY IF EXISTS "Users can delete vehicles from their client" ON public.vehicles;
    CREATE POLICY "Users can delete vehicles from their client"
    ON public.vehicles
    FOR DELETE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if vehicle belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to delete any vehicle
        public.is_current_user_backoffice_admin() = true
      )
    );
  END IF;
END $$;
