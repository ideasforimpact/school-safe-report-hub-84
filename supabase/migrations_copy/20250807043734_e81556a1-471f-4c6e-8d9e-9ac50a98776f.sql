-- Add RLS policies for backoffice_users table to enable login functionality
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backoffice_users') THEN
    -- Allow anonymous read access for login verification
    -- This is needed because users are not authenticated yet during the login process
    DROP POLICY IF EXISTS "Allow anonymous read for login verification" ON public.backoffice_users;
    CREATE POLICY "Allow anonymous read for login verification" 
    ON public.backoffice_users 
    FOR SELECT 
    TO anon, authenticated
    USING (true);

    -- Allow authenticated backoffice users to view their own records
    DROP POLICY IF EXISTS "Users can view their own backoffice record" ON public.backoffice_users;
    CREATE POLICY "Users can view their own backoffice record" 
    ON public.backoffice_users 
    FOR SELECT 
    TO authenticated
    USING (auth.uid()::text = id::text);

    -- Allow service role full access for administrative operations
    DROP POLICY IF EXISTS "Service role full access" ON public.backoffice_users;
    CREATE POLICY "Service role full access" 
    ON public.backoffice_users 
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;