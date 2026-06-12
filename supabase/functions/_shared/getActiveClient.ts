// Deno-side companion to src/services/auth/getActiveClientId.ts.
//
// Edge functions used to look up the caller's employee row by user_id
// alone:
//
//   const { data: employee } = await supabase
//     .from('employees')
//     .select('id, client_id')
//     .eq('user_id', user.id)
//     .single();
//
// That worked when one auth user mapped to exactly one employees row.
// After Feature 1 + 2 a single user_id can belong to N rows (one per
// client), so .single() throws PGRST116 "The result contains 2 rows".
//
// Feature 3 introduced an `app_metadata.{client_id, employee_id}` stamp
// on auth.users (via set_active_client_for_login). Edge functions read
// those claims off the authenticated `user.app_metadata` object exactly
// the same way the frontend reads them, and use them to scope downstream
// queries to the user's active client.
//
// The DB fallback exists for sessions whose JWT predates the stamping
// (legacy sessions / sessions minted before Feature 3 deployed). It
// matches the same priority-fallback chain in
// public.get_current_user_client_id() so RLS and edge functions agree.

// deno-lint-ignore-file no-explicit-any

import type {
  SupabaseClient,
  User,
} from "https://esm.sh/@supabase/supabase-js@2";

export interface ActiveClientContext {
  client_id: string | null;
  employee_id: string | null;
}

/**
 * Resolve the active client_id and employee_id for the authenticated
 * caller. Priority:
 *   1. user.app_metadata.client_id / .employee_id (set by Feature 3
 *      login). Synchronous JSON read, no DB round-trip.
 *   2. DB fallback: first active employees row by user_id. Non-
 *      deterministic for multi-row users — acceptable graceful
 *      degradation until next login re-stamps.
 *
 * Returns nulls if nothing resolves; callers should treat that as
 * "employee not found" and reject the request.
 */
export async function getActiveClient(
  supabase: SupabaseClient,
  user: User,
): Promise<ActiveClientContext> {
  const appMetadata = (user.app_metadata as Record<string, unknown> | undefined) ?? {};
  const jwtClientId = appMetadata.client_id;
  const jwtEmployeeId = appMetadata.employee_id;

  if (typeof jwtClientId === "string" && jwtClientId.length > 0) {
    return {
      client_id: jwtClientId,
      employee_id:
        typeof jwtEmployeeId === "string" && jwtEmployeeId.length > 0
          ? jwtEmployeeId
          : null,
    };
  }

  // Legacy fallback: no app_metadata stamp on this session.
  const { data } = await supabase
    .from("employees")
    .select("id, client_id")
    .eq("user_id", user.id)
    .eq("status", true)
    .limit(1)
    .maybeSingle();

  return {
    client_id: (data?.client_id as string | undefined) ?? null,
    employee_id: (data?.id as string | undefined) ?? null,
  };
}
