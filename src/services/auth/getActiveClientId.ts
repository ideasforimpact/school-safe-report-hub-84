import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve the current authenticated user's ACTIVE client_id.
 *
 * Feature 3 stamps `{ client_id, employee_id }` into
 * `auth.users.raw_app_meta_data` after the user picks a client (or after
 * single-client auto-resolve). The stamp is the authoritative source —
 * the picker's choice, kept in sync with RLS via JWT claims.
 *
 * Before Feature 3, every service that needed "the current user's client"
 * did:
 *
 *   const { data } = await supabase
 *     .from('employees')
 *     .select('client_id')
 *     .eq('user_id', user.id)
 *     .single();
 *
 * That worked when one auth user mapped to exactly one `employees` row.
 * Post-Feature-1+2 a user can have N rows, so the above:
 *   - throws PGRST116 with `.single()`
 *   - returns a non-deterministic row with `.maybeSingle()`.
 *
 * This helper supersedes that pattern. Priority order:
 *
 *   1) JWT `app_metadata.client_id`  ← always set on every login
 *      (Feature 3). Single round-trip to fetch the session, no DB read.
 *
 *   2) DB fallback: `employees.user_id = current` LIMIT 1.
 *      Kept for legacy/pre-Feature-3 sessions (e.g. a JWT minted before
 *      the new stamping was deployed). Non-deterministic for multi-row
 *      users — acceptable graceful degradation until next login re-stamps.
 *
 * Returns `null` if there's no session or no employees row found.
 */
export const getActiveClientId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  // Priority 1: JWT app_metadata.client_id (authoritative).
  const appMetadata = session.user?.app_metadata as Record<string, unknown> | undefined;
  const jwtClientId = appMetadata?.client_id;
  if (typeof jwtClientId === 'string' && jwtClientId.length > 0) {
    return jwtClientId;
  }

  // Priority 2: DB fallback for pre-stamp sessions. The LIMIT 1 here is
  // intentionally non-deterministic — if the user has multiple rows and
  // hasn't been re-stamped, we return SOMETHING rather than nothing.
  // The next login will fix the JWT for them.
  const userId = session.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from('employees')
    .select('client_id')
    .eq('user_id', userId)
    .eq('status', true)
    .limit(1)
    .maybeSingle();

  return (data?.client_id as string | undefined) ?? null;
};

/**
 * Companion helper for callers that need the active employees row id (not
 * just client_id). Reads `app_metadata.employee_id` first; falls back to
 * looking up `(user_id, active_client_id)` which is unique.
 */
export const getActiveEmployeeId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const appMetadata = session.user?.app_metadata as Record<string, unknown> | undefined;
  const jwtEmployeeId = appMetadata?.employee_id;
  if (typeof jwtEmployeeId === 'string' && jwtEmployeeId.length > 0) {
    return jwtEmployeeId;
  }

  const userId = session.user?.id;
  if (!userId) return null;

  const activeClientId = await getActiveClientId();
  if (!activeClientId) return null;

  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .eq('client_id', activeClientId)
    .eq('status', true)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
};
