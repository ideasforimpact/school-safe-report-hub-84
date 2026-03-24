/**
 * IP Whitelist Check Utility
 * Validates if the current user's IP is whitelisted for their client
 * Uses validate-employee edge function which includes IP validation
 */

import { ensureFreshAuthenticatedSession } from '@/utils/sessionValidation';

const ongoingRequests = new Map<string, Promise<IPWhitelistCheckResult>>();

export interface IPWhitelistCheckResult {
  allowed: boolean;
  reason?: string;
  error?: string;
}

function getSupabaseFunctionsUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url ? `${url.replace(/\/$/, '')}/functions/v1/validate-employee` : null;
}

/**
 * Check if the current user's IP is whitelisted for their client.
 * Refreshes session first so stale JWTs (e.g. after days away) do not get false "allowed".
 */
export async function checkIPWhitelist(
  clientId: string | null,
  employeeId: string | null,
): Promise<IPWhitelistCheckResult> {
  if (!clientId) {
    return { allowed: true, reason: 'no_client_id' };
  }

  if (!employeeId) {
    return { allowed: true, reason: 'no_employee_id' };
  }

  const requestKey = `${clientId}-${employeeId}`;

  if (ongoingRequests.has(requestKey)) {
    return ongoingRequests.get(requestKey)!;
  }

  const requestPromise = (async (): Promise<IPWhitelistCheckResult> => {
    try {
      const fresh = await ensureFreshAuthenticatedSession();
      if (!fresh.ok) {
        return {
          allowed: false,
          reason: 'session_invalid',
          error:
            fresh.reason === 'refresh_failed'
              ? 'Your session has expired. Please log in again.'
              : 'Your session is not authenticated. Please login again.',
        };
      }

      const fnUrl = getSupabaseFunctionsUrl();
      if (!fnUrl) {
        console.error('ipWhitelistCheck: VITE_SUPABASE_URL missing');
        return {
          allowed: false,
          reason: 'config_error',
          error: 'Application configuration error. Please try again later.',
        };
      }

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fresh.accessToken}`,
          apikey: anonKey ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, clientId }),
      });

      let body: Record<string, unknown> | null = null;
      try {
        const text = await response.text();
        if (text) body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        /* ignore */
      }

      const code = typeof body?.code === 'string' ? body.code : '';
      const message =
        typeof body?.message === 'string'
          ? body.message
          : 'Employee validation failed';

      if (response.status === 403 || code === 'IP_NOT_WHITELISTED') {
        return {
          allowed: false,
          reason: 'ip_not_whitelisted',
          error: message,
        };
      }

      if (
        response.status === 401 ||
        code === 'ANONYMOUS_TOKEN' ||
        code === 'MISSING_AUTH' ||
        code === 'INVALID_TOKEN' ||
        code === 'NOT_AUTHENTICATED_ROLE'
      ) {
        return {
          allowed: false,
          reason: 'session_invalid',
          error: message,
        };
      }

      if (response.ok && body && body.valid === true) {
        return { allowed: true };
      }

      if (body?.valid === false) {
        return {
          allowed: false,
          reason: 'validation_failed',
          error: message,
        };
      }

      return {
        allowed: false,
        reason: 'validation_failed',
        error: message,
      };
    } catch (error) {
      console.error('Error checking IP whitelist:', error);
      // Transient network errors: do not force logout; RLS still protects data.
      return {
        allowed: true,
        reason: 'network_error',
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    } finally {
      ongoingRequests.delete(requestKey);
    }
  })();

  ongoingRequests.set(requestKey, requestPromise);
  return requestPromise;
}
