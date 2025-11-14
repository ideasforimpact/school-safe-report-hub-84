
-- Enable Row Level Security on incidents table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents') THEN
    ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy to allow users to view incidents from their client or that they're involved with
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents') THEN
    DROP POLICY IF EXISTS "Users can view incidents from their client or involvement" ON public.incidents;
    CREATE POLICY "Users can view incidents from their client or involvement"
    ON public.incidents
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if incident belongs to the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow if user created the incident
        created_by = auth.uid()
        OR
        -- Allow if user is assigned to the incident
        assigned_to = auth.uid()
        OR
        -- Allow backoffice users to view all incidents
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to insert incidents for their client
    DROP POLICY IF EXISTS "Users can insert incidents for their client" ON public.incidents;
    CREATE POLICY "Users can insert incidents for their client"
    ON public.incidents
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if incident is being created for the user's client
        client_id = public.get_current_user_client_id()
        OR
        -- Allow backoffice users to insert incidents for any client
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to update incidents from their client that they're involved with
    DROP POLICY IF EXISTS "Users can update incidents from their client involvement" ON public.incidents;
    CREATE POLICY "Users can update incidents from their client involvement"
    ON public.incidents
    FOR UPDATE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if incident belongs to user's client AND (they created it OR are assigned to it)
        (client_id = public.get_current_user_client_id() AND (created_by = auth.uid() OR assigned_to = auth.uid()))
        OR
        -- Allow backoffice users to update any incident
        public.is_current_user_backoffice_admin() = true
      )
    );

    -- Policy to allow users to delete incidents from their client that they created
    DROP POLICY IF EXISTS "Users can delete incidents they created in their client" ON public.incidents;
    CREATE POLICY "Users can delete incidents they created in their client"
    ON public.incidents
    FOR DELETE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if incident belongs to user's client AND they created it
        (client_id = public.get_current_user_client_id() AND created_by = auth.uid())
        OR
        -- Allow backoffice users to delete any incident
        public.is_current_user_backoffice_admin() = true
      )
    );
  END IF;
END $$;
