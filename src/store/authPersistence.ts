
// Authentication state persistence utilities
const AUTH_STORAGE_KEY = 'auth_state';

export interface PersistedAuthState {
  currentUser: any | null;
  isAuthenticated: boolean;
  isBackofficeUser: boolean;
  authError: string | null;
  configuredModules: any[] | null;
  employeeData: any | null;
  jwtToken?: string; // JWT token for backoffice authentication
  expiresAt?: number; // Token expiration timestamp
}

// Save authentication state to sessionStorage
export const saveAuthState = (state: PersistedAuthState): void => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem(AUTH_STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Error saving auth state to sessionStorage:", error);
  }
};

// Load authentication state from sessionStorage
export const loadAuthState = (): PersistedAuthState | null => {
  console.log('💾 loadAuthState: Loading auth state from sessionStorage');
  try {
    const serializedState = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (serializedState === null) {
      console.log('💾 loadAuthState: No auth state found in sessionStorage');
      return null;
    }
    const parsedState = JSON.parse(serializedState);
    console.log('💾 loadAuthState: Auth state found', { 
      isBackofficeUser: parsedState.isBackofficeUser,
      hasJwtToken: !!parsedState.jwtToken,
      expiresAt: parsedState.expiresAt ? new Date(parsedState.expiresAt).toISOString() : null
    });
    
    // Check if JWT token has expired
    if (parsedState.jwtToken && parsedState.expiresAt) {
      const currentTime = Date.now();
      if (currentTime > parsedState.expiresAt) {
        console.log('💾 loadAuthState: JWT token has expired, clearing auth state', {
          currentTime: new Date(currentTime).toISOString(),
          expiresAt: new Date(parsedState.expiresAt).toISOString()
        });
        clearPersistedAuthState();
        return null;
      }
    }
    
    console.log('💾 loadAuthState: Returning valid auth state');
    return parsedState;
  } catch (error) {
    console.error("💾 loadAuthState: Error loading auth state from sessionStorage:", error);
    return null;
  }
};

// Clear persisted authentication state
export const clearPersistedAuthState = (): void => {
  console.log('💾 clearPersistedAuthState: Clearing auth state from sessionStorage');
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('💾 clearPersistedAuthState: Auth state cleared successfully');
  } catch (error) {
    console.error("💾 clearPersistedAuthState: Error clearing persisted auth state:", error);
  }
};
