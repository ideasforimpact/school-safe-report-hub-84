-- Create a secure function to get client domains during authentication
-- This function runs with elevated privileges to bypass RLS during login
CREATE OR REPLACE FUNCTION public.get_client_domains(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Fetch only the domain information needed for validation
  SELECT jsonb_build_object(
    'allowed_domains', c.allowed_domains,
    'super_admin_allowed_domain', c.super_admin_allowed_domain,
    'active', c.active
  )
  INTO result
  FROM public.clients c
  WHERE c.id = p_client_id;
  
  -- Return the result or null if client not found
  RETURN COALESCE(result, '{"allowed_domains": null, "super_admin_allowed_domain": null, "active": false}'::jsonb);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return safe default in case of error
    RETURN '{"allowed_domains": null, "super_admin_allowed_domain": null, "active": false}'::jsonb;
END;
$function$;