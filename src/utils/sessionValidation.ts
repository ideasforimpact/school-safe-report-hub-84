import { loadAuthState, clearPersistedAuthState } from '@/store/authPersistence';
import { verifyBackofficeJWT, isJWTExpired } from './jwtUtils';

export const validateBackofficeSession = (): boolean => {
  const authState = loadAuthState();
  
  if (!authState || !authState.isBackofficeUser) {
    return false;
  }

  // Check if JWT token exists and is valid
  if (authState.jwtToken) {
    if (isJWTExpired(authState.jwtToken)) {
      console.log('JWT token has expired');
      clearPersistedAuthState();
      return false;
    }

    const decodedToken = verifyBackofficeJWT(authState.jwtToken);
    if (!decodedToken) {
      console.log('JWT token verification failed');
      clearPersistedAuthState();
      return false;
    }

    return true;
  }

  // If no JWT token, check expiration timestamp (fallback)
  if (authState.expiresAt && Date.now() > authState.expiresAt) {
    console.log('Session has expired');
    clearPersistedAuthState();
    return false;
  }

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