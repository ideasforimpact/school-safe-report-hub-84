-- Ensure RLS resolves switched client context for head office users.
-- This fixes reads in settings modules (incident/assessment config) after client switch.

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

  -- 1) Prefer switched context target client when user_client_context exists.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_client_context'
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

  -- 2) Fallback to employee mapped client by user_id.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employees'
  ) THEN
    SELECT e.client_id
    INTO result
    FROM public.employees e
    WHERE e.user_id = auth.uid()
      AND e.status = true
    LIMIT 1;

    IF result IS NOT NULL THEN
      RETURN result;
    END IF;

    -- 3) Final fallback for pre-linked employee rows during auth bootstrap.
    SELECT e.client_id
    INTO result
    FROM public.employees e
    WHERE TRIM(BOTH E'\n\r\t ' FROM e.email) =
          TRIM(BOTH E'\n\r\t ' FROM (current_setting('request.jwt.claims', true)::json->>'email'))
      AND e.status = true
      AND e.user_id IS NULL
    LIMIT 1;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_client_id() TO authenticated;
