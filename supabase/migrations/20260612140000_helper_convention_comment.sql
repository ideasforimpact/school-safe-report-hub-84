-- Feature 4 — convention enforcement, docs-only.
--
-- Adds a COMMENT ON FUNCTION to make the "always go through the helper"
-- rule discoverable via `\df+ get_current_user_client_id`. Zero
-- behavior change. The convention exists because:
--   (a) the switch-client edge function does NOT re-stamp JWT
--       app_metadata.client_id; it only updates user_client_context.
--   (b) the helper transparently consults user_client_context as a
--       fallback after the JWT, so RLS via the helper Just Works.
--   (c) any policy or function that bypasses the helper and reads the
--       JWT claim directly will see stale data for switch-client users,
--       even though the helper would return the right answer.

COMMENT ON FUNCTION public.get_current_user_client_id() IS
$$RLS / SECURITY DEFINER convention: callers MUST go through this helper
to resolve the current user's active client. Do NOT read
(auth.jwt() -> 'app_metadata' ->> 'client_id')::uuid directly in policy
SQL or downstream functions — the helper has fallbacks (user_client_context,
employees by user_id, employees by JWT email) for sessions whose JWT
stamp is stale (switch-client flow) or missing (legacy pre-Feature-3
sessions). Frontend code uses the parallel helper
src/services/auth/getActiveClientId.ts which mirrors the same priority
chain on the JS side.$$;

COMMENT ON FUNCTION public.get_current_user_employee_id() IS
$$RLS / SECURITY DEFINER convention: callers MUST go through this helper
to resolve the current user's active employees.id. Do NOT read
(auth.jwt() -> 'app_metadata' ->> 'employee_id')::uuid directly — the
helper has fallbacks. Frontend code uses
src/services/auth/getActiveClientId.ts::getActiveEmployeeId().$$;
