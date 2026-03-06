import { loadAuthState, clearPersistedAuthState } from '@/store/authPersistence';
import { verifyBackofficeToken, isTokenExpired } from './jwtUtils';
import { supabase } from '@/integrations/supabase/client';
import { authCoordinator } from './authCoordinator';

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

// Validate backoffice session using custom JWT
export const validateBackofficeSession = (): boolean => {
  console.log('🔐 validateBackofficeSession: Starting validation');
  const authState = loadAuthState();
  
  if (!authState || !authState.isBackofficeUser) {
    console.log('🔐 validateBackofficeSession: No auth state or not backoffice user', { authState });
    return false;
  }

  console.log('🔐 validateBackofficeSession: Auth state found', { 
    hasJwtToken: !!authState.jwtToken, 
    isBackofficeUser: authState.isBackofficeUser,
    expiresAt: authState.expiresAt 
  });

  // Check if JWT token exists and is valid
  if (authState.jwtToken) {
    console.log('🔐 validateBackofficeSession: Checking JWT token');
    if (isTokenExpired(authState.jwtToken)) {
      console.log('🔐 validateBackofficeSession: JWT token has expired');
      clearPersistedAuthState();
      return false;
    }

    const decodedToken = verifyBackofficeToken(authState.jwtToken);
    if (!decodedToken) {
      console.log('🔐 validateBackofficeSession: JWT token verification failed');
      clearPersistedAuthState();
      return false;
    }

    console.log('🔐 validateBackofficeSession: JWT token is valid', { decodedToken });
    return true;
  }

  // If no JWT token, check expiration timestamp (fallback)
  if (authState.expiresAt && Date.now() > authState.expiresAt) {
    console.log('🔐 validateBackofficeSession: Session has expired (fallback check)');
    clearPersistedAuthState();
    return false;
  }

  console.log('🔐 validateBackofficeSession: Returning authenticated status', { isAuthenticated: authState.isAuthenticated });
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