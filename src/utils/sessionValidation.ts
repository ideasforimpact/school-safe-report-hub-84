import { loadAuthState, clearPersistedAuthState } from '@/store/authPersistence';
// Legacy custom-JWT helpers kept for one-shot fallback when reading auth_state
// rows persisted by an older build; new logins do not write these tokens.
import { verifyBackofficeToken, isTokenExpired } from './jwtUtils';
import { supabase } from '@/integrations/supabase/client';
import { BACKOFFICE_STORAGE_KEY } from '@/integrations/supabase/client';
import { authCoordinator } from './authCoordinator';
import type { Session } from '@supabase/supabase-js';

/**
 * True only when JWT role is exactly `authenticated` (SafeSchool / RLS expects this).
 * Rejects anon, missing token, corrupt JWT, or unknown role — avoids "Unknown" rows from RLS.
 */
export function isSupabaseAccessTokenAuthenticated(accessToken: string | undefined): boolean {
  return getSupabaseTokenRole(accessToken) === 'authenticated';
}

/**
 * Refresh session if access token is expired or near expiry, then verify role is authenticated.
 * Call this before edge functions or sensitive reads so returning users get a valid JWT.
 */
export async function ensureFreshAuthenticatedSession(): Promise<
  | { ok: true; accessToken: string; session: Session }
  | { ok: false; reason: 'no_session' | 'refresh_failed' | 'not_authenticated' }
> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    return { ok: false, reason: 'no_session' };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = session.expires_at ?? 0;
  let active = session;

  if (exp <= now + 120) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      return { ok: false, reason: 'refresh_failed' };
    }
    active = refreshed.session;
  }

  if (!isSupabaseAccessTokenAuthenticated(active.access_token)) {
    return { ok: false, reason: 'not_authenticated' };
  }

  return { ok: true, accessToken: active.access_token, session: active };
}

/**
 * Decode Supabase JWT payload and return the role (authenticated | anon).
 * Used to detect anonymous sessions so we can redirect to login instead of calling validate-employee.
 */
export function getSupabaseTokenRole(accessToken: string | undefined): 'authenticated' | 'anon' | null {
  if (!accessToken || typeof accessToken !== 'string') {
    console.log('[Session] getSupabaseTokenRole: no token or invalid type');
    return null;
  }
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.log('[Session] getSupabaseTokenRole: invalid JWT format');
      return null;
    }
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded)) as { role?: string };
    const role = decoded?.role;
    if (role === 'authenticated') {
      console.log('[Session] getSupabaseTokenRole: role=authenticated — session is valid, not restricted');
      return 'authenticated';
    }
    if (role === 'anon') {
      console.log('[Session] getSupabaseTokenRole: role=anon — anonymous session detected, will be restricted');
      return 'anon';
    }
    console.log('[Session] getSupabaseTokenRole: unknown role', role ?? 'undefined');
    return null;
  } catch (e) {
    console.warn('[Session] getSupabaseTokenRole: decode failed', e);
    return null;
  }
}

// Validate Supabase session for SSO users
export const validateSupabaseSession = async (): Promise<boolean> => {
  console.log('🔐 validateSupabaseSession: Starting validation for SSO user');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('🔐 validateSupabaseSession: Error getting session', error);
      return false;
    }
    
    if (!session) {
      console.log('🔐 validateSupabaseSession: No Supabase session found');
      return false;
    }
    
    // Check if session is expired
    const expiresAt = session.expires_at;
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (expiresAt && currentTime > expiresAt) {
      console.log('🔐 validateSupabaseSession: Supabase session has expired');
      return false;
    }
    
    console.log('🔐 validateSupabaseSession: Supabase session is valid');
    return true;
  } catch (error) {
    console.error('🔐 validateSupabaseSession: Error validating session', error);
    return false;
  }
};

/**
 * Read the Supabase access_token expiry directly from the backoffice
 * localStorage bucket (BACKOFFICE_STORAGE_KEY). The Supabase SDK persists its
 * session there as JSON; we just inspect `expires_at` synchronously.
 *
 * Returns:
 *   - { hasSession: true,  expired: false } → access_token still valid
 *   - { hasSession: true,  expired: true  } → access_token expired but a
 *       refresh_token is present in the same blob; the SDK will auto-refresh
 *       on the next async call (autoRefreshToken: true)
 *   - { hasSession: false }                → no Supabase session at all
 */
function readBackofficeSupabaseSession(): {
  hasSession: boolean;
  hasRefreshToken: boolean;
  expired: boolean;
  expiresAt: number | null;
} {
  if (typeof window === 'undefined') {
    return { hasSession: false, hasRefreshToken: false, expired: true, expiresAt: null };
  }
  try {
    const raw = localStorage.getItem(BACKOFFICE_STORAGE_KEY);
    if (!raw) {
      return { hasSession: false, hasRefreshToken: false, expired: true, expiresAt: null };
    }
    const parsed = JSON.parse(raw);
    const expiresAtSec: number | null = parsed?.expires_at ?? parsed?.currentSession?.expires_at ?? null;
    const refreshToken: string | null =
      parsed?.refresh_token ?? parsed?.currentSession?.refresh_token ?? null;
    const accessToken: string | null =
      parsed?.access_token ?? parsed?.currentSession?.access_token ?? null;
    if (!accessToken) {
      return {
        hasSession: false,
        hasRefreshToken: !!refreshToken,
        expired: true,
        expiresAt: null,
      };
    }
    const expired = expiresAtSec !== null ? Date.now() / 1000 > expiresAtSec : true;
    return {
      hasSession: true,
      hasRefreshToken: !!refreshToken,
      expired,
      expiresAt: expiresAtSec,
    };
  } catch (err) {
    console.warn('[AUTH-DIAG] readBackofficeSupabaseSession: parse error', err);
    return { hasSession: false, hasRefreshToken: false, expired: true, expiresAt: null };
  }
}

/**
 * Validate that the current tab has a usable backoffice session.
 *
 * The new contract (post-custom-JWT removal):
 *   ✓ The persisted Redux state says this is a backoffice user
 *     (sessionType: 'backoffice' / isBackofficeUser: true).
 *   ✓ A Supabase session exists in the backoffice bucket
 *     — either still valid, or expired-but-with-a-refresh-token (the SDK
 *       will refresh transparently before the next API call).
 *
 * Returns false (and clears the bucket) only when there is genuinely no path
 * back to a usable session: no Supabase session at all, or expired with no
 * refresh token to use.
 *
 * Falls back to the legacy custom-JWT check if the persisted state was
 * written by an older build that hasn't been re-logged-in yet.
 */
export const validateBackofficeSession = (): boolean => {
  console.log('[AUTH-DIAG] validateBackofficeSession: Starting validation');
  const authState = loadAuthState();

  if (!authState || !authState.isBackofficeUser) {
    console.warn('[AUTH-DIAG] validateBackofficeSession: false', {
      reason: !authState ? 'no authState in storage' : 'authState.isBackofficeUser is false',
    });
    return false;
  }

  // ── New path: Supabase access_token + refresh_token ─────────────────
  const supaSession = readBackofficeSupabaseSession();
  console.log('[AUTH-DIAG] validateBackofficeSession: Supabase bucket inspection', {
    hasSession: supaSession.hasSession,
    hasRefreshToken: supaSession.hasRefreshToken,
    expired: supaSession.expired,
    expiresAt: supaSession.expiresAt
      ? new Date(supaSession.expiresAt * 1000).toISOString()
      : null,
  });

  if (supaSession.hasSession) {
    if (!supaSession.expired) {
      console.log('[AUTH-DIAG] validateBackofficeSession: access_token still valid');
      return true;
    }
    if (supaSession.hasRefreshToken) {
      console.log(
        '[AUTH-DIAG] validateBackofficeSession: access_token expired but refresh_token present — SDK will refresh on next call'
      );
      return true;
    }
    console.warn(
      '[AUTH-DIAG] validateBackofficeSession: access_token expired and no refresh_token — clearing'
    );
    clearPersistedAuthState();
    return false;
  }

  // ── Legacy path: custom JWT issued by old build ─────────────────────
  // If we still see a custom JWT in auth_state, validate it the old way so
  // already-logged-in users from a previous build aren't booted instantly.
  if (authState.jwtToken) {
    console.log('[AUTH-DIAG] validateBackofficeSession: legacy custom JWT path (no Supabase session)');
    if (isTokenExpired(authState.jwtToken)) {
      console.warn('[AUTH-DIAG] validateBackofficeSession: legacy JWT expired');
      clearPersistedAuthState();
      return false;
    }
    const decoded = verifyBackofficeToken(authState.jwtToken);
    if (!decoded) {
      console.warn('[AUTH-DIAG] validateBackofficeSession: legacy JWT verification failed');
      clearPersistedAuthState();
      return false;
    }
    return true;
  }

  if (authState.expiresAt && Date.now() > authState.expiresAt) {
    console.warn('[AUTH-DIAG] validateBackofficeSession: legacy expiresAt elapsed');
    clearPersistedAuthState();
    return false;
  }

  console.warn(
    '[AUTH-DIAG] validateBackofficeSession: no Supabase session and no legacy JWT — falling back to authState.isAuthenticated',
    { isAuthenticated: authState.isAuthenticated }
  );
  return authState.isAuthenticated;
};

// Enhanced session validation with logout state awareness
export const validateSession = async (): Promise<boolean> => {
  // Check for login in progress - never validate during login
  const isLoginInProgress = sessionStorage.getItem('is_login_in_progress') === 'true' ||
                           localStorage.getItem('is_login_in_progress') === 'true';
  
  // CRITICAL: Never validate during logout process or login to prevent re-authentication
  if (authCoordinator.isLogoutInProgress() || 
      authCoordinator.shouldBlockOperation('session validation') || 
      isLoginInProgress) {
    console.log('🔐 validateSession: Validation blocked - logout/login in progress or coordinator block');
    return true; // Don't invalidate during blocked operations
  }

  console.log('🔐 validateSession: Starting enhanced session validation');
  const authState = loadAuthState();
  
  // If no auth state, invalid session (unless we're logging out)
  if (!authState) {
    console.log('🔐 validateSession: No auth state found');
    return false;
  }
  
  // CRITICAL FIX: For SSO users, return true immediately - let Supabase handle everything
  if (authState.sessionType === 'sso') {
    console.log('🔐 validateSession: SSO user detected - skipping validation, letting Supabase handle session');
    return true; // Always return true for SSO users
  }

  // Try to start validation - exit if already in progress (only for backoffice users)
  if (!authCoordinator.startValidation()) {
    console.log('🔐 validateSession: Validation already in progress, returning true');
    return true;
  }

  try {
    // For backoffice users, validate JWT
    console.log('🔐 validateSession: Detected backoffice user, using JWT validation');
    return validateBackofficeSession();
  } finally {
    authCoordinator.endValidation();
  }
};

export const getSessionTimeRemaining = (): number => {
  const authState = loadAuthState();
  
  // For SSO users, return infinite time remaining (no manual expiry management)
  if (!authState || !authState.isBackofficeUser) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Only apply time-based expiry for backoffice users
  if (!authState.expiresAt) {
    return 0;
  }

  const timeRemaining = authState.expiresAt - Date.now();
  return Math.max(0, timeRemaining);
};

export const isSessionExpired = (): boolean => {
  const authState = loadAuthState();
  
  // SSO users never expire (Supabase handles token refresh)
  if (!authState || !authState.isBackofficeUser) {
    return false;
  }
  
  // Only check expiry for backoffice users
  return getSessionTimeRemaining() === 0;
};