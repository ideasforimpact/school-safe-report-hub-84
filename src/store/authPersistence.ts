
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
  sessionType?: 'backoffice' | 'sso'; // Track session type for proper validation
}

// Save authentication state to appropriate storage based on session type
export const saveAuthState = (state: PersistedAuthState): void => {
  try {
    const serializedState = JSON.stringify(state);
    
    // Use sessionStorage for backoffice (more secure, shorter-lived)
    // Use localStorage for SSO sessions (better persistence across browser sessions)
    if (state.sessionType === 'backoffice' || state.isBackofficeUser) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serializedState);
      console.log('💾 saveAuthState: Saved backoffice auth state to sessionStorage');
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, serializedState);
      console.log('💾 saveAuthState: Saved SSO auth state to localStorage');
    }
  } catch (error) {
    console.error("Error saving auth state:", error);
  }
};

// Load authentication state from appropriate storage
export const loadAuthState = (): PersistedAuthState | null => {
  console.log('💾 loadAuthState: Loading auth state');
  try {
    // Try sessionStorage first (for backoffice users)
    let serializedState = sessionStorage.getItem(AUTH_STORAGE_KEY);
    let storageType = 'sessionStorage';
    
    // If not found in sessionStorage, try localStorage (for SSO users)
    if (serializedState === null) {
      serializedState = localStorage.getItem(AUTH_STORAGE_KEY);
      storageType = 'localStorage';
    }
    
    if (serializedState === null) {
      console.log('💾 loadAuthState: No auth state found in either storage');
      return null;
    }
    const parsedState = JSON.parse(serializedState);
    console.log('💾 loadAuthState: Auth state found', { 
      isBackofficeUser: parsedState.isBackofficeUser,
      hasJwtToken: !!parsedState.jwtToken,
      expiresAt: parsedState.expiresAt ? new Date(parsedState.expiresAt).toISOString() : null,
      sessionType: parsedState.sessionType || (parsedState.isBackofficeUser ? 'backoffice' : 'sso'),
      storageType
    });
    
    // Only check JWT token expiration for backoffice users
    const sessionType = parsedState.sessionType || (parsedState.isBackofficeUser ? 'backoffice' : 'sso');
    if (sessionType === 'backoffice' && parsedState.jwtToken && parsedState.expiresAt) {
      const currentTime = Date.now();
      if (currentTime > parsedState.expiresAt) {
        console.log('💾 loadAuthState: JWT token has expired for backoffice user, clearing auth state', {
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

// Clear persisted authentication state from both storages
export const clearPersistedAuthState = (): void => {
  console.log('💾 clearPersistedAuthState: Clearing auth state from both storages');
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('💾 clearPersistedAuthState: Auth state cleared successfully from both storages');
  } catch (error) {
    console.error("💾 clearPersistedAuthState: Error clearing persisted auth state:", error);
  }
};
