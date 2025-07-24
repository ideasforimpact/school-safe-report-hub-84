import { loadAuthState, clearPersistedAuthState } from '@/store/authPersistence';
import { verifyBackofficeToken, isTokenExpired } from './jwtUtils';

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

export const getSessionTimeRemaining = (): number => {
  const authState = loadAuthState();
  
  if (!authState || !authState.expiresAt) {
    return 0;
  }

  const timeRemaining = authState.expiresAt - Date.now();
  return Math.max(0, timeRemaining);
};

export const isSessionExpired = (): boolean => {
  return getSessionTimeRemaining() === 0;
};