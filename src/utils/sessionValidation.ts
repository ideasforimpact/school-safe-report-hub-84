import { loadAuthState, clearPersistedAuthState } from '@/store/authPersistence';
import { verifyBackofficeToken, isTokenExpired } from './jwtUtils';
import { supabase } from '@/integrations/supabase/client';
import { authCoordinator } from './authCoordinator';

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
  // CRITICAL: Never validate during logout process to prevent re-authentication
  if (authCoordinator.isLogoutInProgress() || authCoordinator.shouldBlockOperation('session validation')) {
    console.log('🔐 validateSession: Validation blocked - logout in progress or coordinator block');
    return true; // Don't invalidate during blocked operations
  }

  // Try to start validation - exit if already in progress
  if (!authCoordinator.startValidation()) {
    console.log('🔐 validateSession: Validation already in progress, returning true');
    return true;
  }

  try {
    console.log('🔐 validateSession: Starting enhanced session validation');
    const authState = loadAuthState();
    
    // If no auth state, invalid session (unless we're logging out)
    if (!authState) {
      console.log('🔐 validateSession: No auth state found');
      return false;
    }
    
    // Double-check logout state from auth state
    if (authState.sessionType === 'sso') {
      // For SSO users, validate Supabase session
      console.log('🔐 validateSession: Detected SSO user, using Supabase validation');
      return await validateSupabaseSession();
    } else {
      // For backoffice users, validate JWT
      console.log('🔐 validateSession: Detected backoffice user, using JWT validation');
      return validateBackofficeSession();
    }
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