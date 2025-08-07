-- Add RLS policies for backoffice_users table to enable login functionality

-- Allow anonymous read access for login verification
-- This is needed because users are not authenticated yet during the login process
CREATE POLICY "Allow anonymous read for login verification" 
ON public.backoffice_users 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow authenticated backoffice users to view their own records
CREATE POLICY "Users can view their own backoffice record" 
ON public.backoffice_users 
FOR SELECT 
TO authenticated
USING (auth.uid()::text = id::text);

-- Allow service role full access for administrative operations
CREATE POLICY "Service role full access" 
ON public.backoffice_users 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);