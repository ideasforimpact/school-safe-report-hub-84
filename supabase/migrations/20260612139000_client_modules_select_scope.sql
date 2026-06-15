-- Feature 4 (H-3) — tighten the `client_modules` SELECT policy.
--
-- The original policy (20251110094500_policies_client_modules.sql:17-19)
-- allowed any authenticated user to view every client's module config:
--   USING (auth.uid() IS NOT NULL)
--
-- Pre-multi-client this was a low-impact leak — most users only knew
-- about their own client anyway. Post-multi-client the picker visibly
-- shows other clients, so the leak becomes easily exploitable: a user
-- can list module configurations across every client they don't belong
-- to via `select * from client_modules`.
--
-- Tightened predicate mirrors the existing INSERT/UPDATE/DELETE policies
-- on the same table: scope to the current user's active client, with a
-- backoffice-admin escape hatch for SaaS owners.

DROP POLICY IF EXISTS "Users can view client modules from their client"
  ON public.client_modules;

CREATE POLICY "Users can view client modules from their client"
ON public.client_modules
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    client_id = public.get_current_user_client_id()
    OR public.is_current_user_backoffice_admin() = true
  )
);
