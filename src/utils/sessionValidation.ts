import { loadAuthState, clearPersistedAuthState } from '@/store/authPersistence';
import { verifyBackofficeToken, isTokenExpired } from './jwtUtils';
import { supabase } from '@/integrations/supabase/client';
import { validationStateManager } from './validationStateManager';

// Validate Supabase session for SSO users
// IMPORTANT NOTE: For SSO users, we don't manually validate session expiry
// because Supabase handles token refresh automatically. Manual expiry checks
// can cause false positives and unnecessary session invalidations.
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
    
    // For SSO users, we trust Supabase's built-in session management
    // The getSession() call above already handles token refresh if needed
    // and returns null if the session is truly invalid/expired
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

// Universal session validation that determines user type and applies appropriate validation
export const validateSession = async (): Promise<boolean> => {
  // Use validation state manager to prevent conflicts
  if (!validationStateManager.startValidation()) {
    console.log('🔐 validateSession: Validation blocked by state manager');
    return true; // Return true to avoid triggering logout when validation is blocked
  }

  try {
    console.log('🔐 validateSession: Starting universal session validation');
    const authState = loadAuthState();
    
    // If no auth state, invalid session
    if (!authState) {
      console.log('🔐 validateSession: No auth state found');
      return false;
    }
    
    // Determine user type and apply appropriate validation
    if (authState.isBackofficeUser) {
      console.log('🔐 validateSession: Detected backoffice user, using JWT validation');
      return validateBackofficeSession();
    } else {
      console.log('🔐 validateSession: Detected SSO user, using Supabase validation');
      return await validateSupabaseSession();
    }
  } finally {
    validationStateManager.endValidation();
  }
};

export const getSessionTimeRemaining = (): number => {
  const authState = loadAuthState();
  
  // For SSO users, return infinite time remaining since Supabase handles token lifecycle
  if (!authState || !authState.isBackofficeUser) {
    return Number.MAX_SAFE_INTEGER;
  }
  
  // Only check expiry for backoffice users with custom JWT tokens
  if (!authState.expiresAt) {
    return 0;
  }

  const timeRemaining = authState.expiresAt - Date.now();
  return Math.max(0, timeRemaining);
};

export const isSessionExpired = (): boolean => {
  const authState = loadAuthState();
  
  // For SSO users, sessions never expire manually (handled by Supabase)
  if (!authState || !authState.isBackofficeUser) {
    return false;
  }
  
  // Only check expiry for backoffice users
  return getSessionTimeRemaining() === 0;
};