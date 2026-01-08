-- Create RPC function to get client_integration records for authentication
-- This function bypasses RLS and returns client_integration records for a given client_id


CREATE OR REPLACE FUNCTION public.get_client_integration_for_auth(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  client_id uuid,
  target_client_id uuid,
  target_client_name text,
  is_linked boolean,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  -- It's specifically designed to work during authentication
  
  -- Check if client_integration table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'client_integration'
  ) THEN
    RETURN;
  END IF;

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

-- Add comment
COMMENT ON FUNCTION public.get_client_integration_for_auth(uuid) IS 
'Returns client_integration records for a given client_id. Used during authentication to bypass RLS and fetch integration data.';

