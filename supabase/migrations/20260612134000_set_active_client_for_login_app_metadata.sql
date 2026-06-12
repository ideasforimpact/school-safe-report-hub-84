-- Feature 3 (multi-employee auth resolution).
--
-- After Feature 1's picker resolves the user's chosen client (or after a
-- single-client login auto-resolves), the frontend calls this RPC to stamp
-- {client_id, employee_id} into auth.users.raw_app_meta_data. That JSON
-- becomes part of the JWT on the next session refresh, so RLS predicates
-- can read auth.jwt() -> 'app_metadata' ->> 'client_id' directly — no
-- subquery against employees, no PG 21000, no silent wrong-row.
--
-- Validation guards (all server-side, can't be bypassed from the browser):
--   1) auth.uid() must be set (request is actually authenticated).
--   2) The employees row identified by (id, client_id, status=true) must
--      exist — prevents writing claims for a row that doesn't belong here
--      or was just demoted.
--   3) The auth.users.email must match employees.email (case-insensitive,
--      trimmed) — prevents user A from setting claims for user B's
--      employee row even if they somehow guessed the id.
--
-- raw_app_meta_data is merged (||) into the existing JSONB so we don't
-- clobber other claims Supabase sets during OAuth (provider, providers).

CREATE OR REPLACE FUNCTION public.set_active_client_for_login(
  p_employee_id uuid,
  p_client_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_user_id        uuid := auth.uid();
  v_employee_email text;
  v_user_email     text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not authenticated'
    );
  END IF;

  -- Guard 2: matching active employee row exists for the (id, client) pair.
  SELECT email
    INTO v_employee_email
    FROM public.employees
   WHERE id = p_employee_id
     AND client_id = p_client_id
     AND status = true
   LIMIT 1;

  IF v_employee_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'employee row not found or inactive for the given client'
    );
  END IF;

  -- Guard 3: auth user's email matches the employee row's email. Mirrors
  -- the trim-and-lowercase pattern used elsewhere (link_user_to_employee).
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL
     OR LOWER(BTRIM(v_user_email)) <> LOWER(BTRIM(v_employee_email)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'auth user email does not match employee email'
    );
  END IF;

  -- Merge — preserves existing keys (provider, providers, etc.) and
  -- overwrites client_id / employee_id on every call (a re-login that
  -- picks a different client cleanly flips both).
  UPDATE auth.users
     SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
             'client_id',   p_client_id::text,
             'employee_id', p_employee_id::text
           )
   WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'client_id', p_client_id,
    'employee_id', p_employee_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database error: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_client_for_login(uuid, uuid) TO authenticated;
