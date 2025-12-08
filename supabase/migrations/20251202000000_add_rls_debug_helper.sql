-- Debug helper for RLS policies
-- This function lets you quickly see what Postgres "sees" for the current request:
--   - auth.uid()
--   - full JWT claims
--   - get_current_user_client_id()
--   - is_current_user_backoffice_admin()
--
-- Usage (from frontend or edge functions):
--   const { data, error } = await supabase.rpc('debug_current_rls_context');
--   console.log(data);

create or replace function public.debug_current_rls_context()
returns table (
  auth_uid uuid,
  raw_jwt_claims jsonb,
  current_client_id uuid,
  is_backoffice_admin boolean
)
language sql
security definer
set search_path = public
as $$
  select
    auth.uid()::uuid as auth_uid,
    current_setting('request.jwt.claims', true)::jsonb as raw_jwt_claims,
    get_current_user_client_id()::uuid as current_client_id,
    is_current_user_backoffice_admin() as is_backoffice_admin;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.debug_current_rls_context() to authenticated;
grant execute on function public.debug_current_rls_context() to anon;


