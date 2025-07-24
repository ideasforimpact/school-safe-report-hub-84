
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
  try {
    const serializedState = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    const parsedState = JSON.parse(serializedState);
    
    // Check if JWT token has expired
    if (parsedState.jwtToken && parsedState.expiresAt) {
      const currentTime = Date.now();
      if (currentTime > parsedState.expiresAt) {
        console.log('JWT token has expired, clearing auth state');
        clearPersistedAuthState();
        return null;
      }
    }
    
    return parsedState;
  } catch (error) {
    console.error("Error loading auth state from sessionStorage:", error);
    return null;
  }
};

// Clear persisted authentication state
export const clearPersistedAuthState = (): void => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing persisted auth state:", error);
  }
};
