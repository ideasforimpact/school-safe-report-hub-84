-- Create RPC function to get client integration for authentication
-- This function bypasses RLS and returns client integration records for a given client_id
-- Used during authentication to fetch integration data

CREATE OR REPLACE FUNCTION public.get_client_integration_for_auth(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  target_client_id uuid,
  target_client_name text,
  is_linked boolean,
  active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  updated_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return all client integration records for the given client_id
  -- This function runs with SECURITY DEFINER to bypass RLS
  RETURN QUERY
  SELECT 
    ci.id,
    ci.client_id,
    ci.target_client_id,
    ci.target_client_name,
    ci.is_linked,
    ci.active,
    ci.created_at,
    ci.updated_at,
    ci.updated_by
  FROM public.client_integration ci
  WHERE ci.client_id = p_client_id
  ORDER BY ci.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_client_integration_for_auth(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_integration_for_auth(uuid) TO anon;

