-- Feature 1 + 2 follow-up: after the multi-client picker resolves on a
-- specific client, we need to persist that choice somewhere RLS can read.
-- get_current_user_client_id() already prefers
-- user_client_context.target_client_id (see migration
-- 20260420111500_update_get_current_user_client_id_for_switched_context.sql)
-- so all we need is a SECURITY DEFINER RPC the frontend can call from the
-- post-picker auth flow to upsert that row.
--
-- The function is callable by `authenticated` and guarded so a user can
-- only set their own context, and only for a client they actually belong
-- to (active employees row required).

CREATE OR REPLACE FUNCTION public.set_user_client_context_for_login(
  p_user_id uuid,
  p_client_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_access_role_id uuid;
BEGIN
  -- Guard 1: the caller must be the user whose context we're setting.
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized: can only set context for own user_id';
  END IF;

  -- Guard 2: the caller must actually belong to this client (an active
  -- employees row keyed by (user_id, client_id) must exist). This prevents
  -- a user from forging a context for a client they shouldn't see.
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE user_id = p_user_id
      AND client_id = p_client_id
      AND status = true
  ) THEN
    RAISE EXCEPTION 'unauthorized: no active employee row for this user/client';
  END IF;

  -- Look up the W/R (full_access) role. For a login into one of your own
  -- home clients, full access is the right baseline; the existing
  -- switch-client flow can later downgrade target_client_id with R if a
  -- super admin switches into a sub-client.
  SELECT id INTO v_full_access_role_id
  FROM public.client_roles
  WHERE access_level = 'W/R'
  LIMIT 1;

  IF v_full_access_role_id IS NULL THEN
    RAISE EXCEPTION 'client_roles seed missing W/R (full_access) role';
  END IF;

  -- Upsert. PRIMARY KEY is user_id so ON CONFLICT (user_id) is correct.
  -- On a fresh login we set home = target = picked. If the user later
  -- uses the in-app head-office switch, that flow updates target only.
  INSERT INTO public.user_client_context (
    user_id, home_client_id, target_client_id, role_id
  )
  VALUES (p_user_id, p_client_id, p_client_id, v_full_access_role_id)
  ON CONFLICT (user_id) DO UPDATE
  SET
    home_client_id   = EXCLUDED.home_client_id,
    target_client_id = EXCLUDED.target_client_id,
    role_id          = EXCLUDED.role_id,
    updated_at       = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_client_context_for_login(uuid, uuid) TO authenticated;
