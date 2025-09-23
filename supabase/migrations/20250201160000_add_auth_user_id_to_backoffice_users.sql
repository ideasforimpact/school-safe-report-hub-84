-- Add auth_user_id column to backoffice_users table to reference Supabase auth users
ALTER TABLE public.backoffice_users 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance on auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_backoffice_users_auth_user_id 
ON public.backoffice_users(auth_user_id);

-- Add comment to document the purpose of this column
COMMENT ON COLUMN public.backoffice_users.auth_user_id IS 'Reference to Supabase auth.users table for linking backoffice users to their auth accounts';

-- Update the is_current_user_backoffice_admin function to also check auth_user_id
CREATE OR REPLACE FUNCTION public.is_current_user_backoffice_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.backoffice_users 
    WHERE (id = auth.uid() OR auth_user_id = auth.uid())
    AND is_saas_admin = true
  );
$$;












