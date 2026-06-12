-- Feature 3 (multi-employee auth resolution).
--
-- Rewrites get_current_user_client_id() and adds get_current_user_employee_id()
-- so RLS resolves the user's active client/employee from JWT app_metadata
-- (stamped by set_active_client_for_login on every login) instead of running
-- a subquery against employees on every check.
--
-- The fallback chain preserves backward compatibility for in-flight sessions
-- that haven't been re-stamped yet, and for users that only ever had a
-- single employees row (single-client deployments, pre-Feature-1 data).
--
-- IMPORTANT: every RLS policy that already calls these helpers benefits
-- automatically. Policies still using bare `WHERE user_id = auth.uid()`
-- subqueries are swept separately in 20260612136000_rls_sweep_employee_subquery.sql.

CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1) Preferred: JWT app_metadata.client_id, stamped by
  --    public.set_active_client_for_login on every login. Single-pass,
  --    no DB read, deterministic regardless of how many employees rows
  --    share this user_id.
  BEGIN
    result := NULLIF(
      auth.jwt() -> 'app_metadata' ->> 'client_id',
      ''
    )::uuid;
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- JWT missing, not a JSON object, or client_id not a UUID — fall through.
    NULL;
  END;

  -- 2) Legacy switched-context table. Kept for any session that landed
  --    here via the older switch-client edge function before Feature 3.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'user_client_context'
  ) THEN
    SELECT ucc.target_client_id
      INTO result
      FROM public.user_client_context ucc
     WHERE ucc.user_id = auth.uid()
     LIMIT 1;
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  END IF;

  -- 3) Fallback: first active employees row for this user_id. Returns
  --    deterministic data for single-client users; for multi-client users
  --    that somehow reach this branch (no JWT stamp yet) it picks a row
  --    non-deterministically — best-effort graceful degradation until
  --    the next login re-stamps.
  SELECT e.client_id
    INTO result
    FROM public.employees e
   WHERE e.user_id = auth.uid()
     AND e.status = true
   LIMIT 1;
  IF result IS NOT NULL THEN
    RETURN result;
  END IF;

  -- 4) Final fallback: unlinked employees row matched by JWT email. Used
  --    during the auth bootstrap window before user_id is stamped on the
  --    row. Mirrors the pattern in the prior version of this function.
  SELECT e.client_id
    INTO result
    FROM public.employees e
   WHERE TRIM(BOTH E'\n\r\t ' FROM e.email) =
         TRIM(BOTH E'\n\r\t ' FROM (current_setting('request.jwt.claims', true)::json->>'email'))
     AND e.status = true
     AND e.user_id IS NULL
   LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_client_id() TO authenticated;


-- Companion helper for policies that need the specific employees row id
-- of the current user on the current client (e.g. "assigned_to IN (SELECT
-- id FROM employees WHERE user_id = auth.uid())" — now becomes
-- "assigned_to = public.get_current_user_employee_id()").
CREATE OR REPLACE FUNCTION public.get_current_user_employee_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result uuid;
  v_active_client uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1) Preferred: JWT app_metadata.employee_id (stamped by login).
  BEGIN
    result := NULLIF(
      auth.jwt() -> 'app_metadata' ->> 'employee_id',
      ''
    )::uuid;
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2) Fallback: derive from (user_id, active_client_id). Scoping by
  --    client narrows multi-client users to exactly one row, so the LIMIT
  --    1 is deterministic when the client is known.
  v_active_client := public.get_current_user_client_id();
  IF v_active_client IS NOT NULL THEN
    SELECT e.id
      INTO result
      FROM public.employees e
     WHERE e.user_id = auth.uid()
       AND e.client_id = v_active_client
       AND e.status = true
     LIMIT 1;
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  END IF;

  -- 3) Final fallback: first active row for this user_id (pre-stamp /
  --    single-client behavior).
  SELECT e.id
    INTO result
    FROM public.employees e
   WHERE e.user_id = auth.uid()
     AND e.status = true
   LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_employee_id() TO authenticated;
