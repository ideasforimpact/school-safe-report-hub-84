
// Authentication state persistence utilities
const AUTH_STORAGE_KEY = 'auth_state';

export interface PersistedAuthState {
  currentUser: any | null;
  isAuthenticated: boolean;
  isBackofficeUser: boolean;
  authError: string | null;
  configuredModules: any[] | null;
}

// Save authentication state to sessionStorage
export const saveAuthState = (state: PersistedAuthState): void => {
  try {
    // Only save modules if they contain actual data
    const stateToSave = {
      ...state,
      configuredModules: state.configuredModules && state.configuredModules.length > 0 
        ? state.configuredModules 
        : null
    };
    
    const serializedState = JSON.stringify(stateToSave);
    sessionStorage.setItem(AUTH_STORAGE_KEY, serializedState);
    console.log("Auth state saved to sessionStorage:", stateToSave);
  } catch (error) {
    console.error("Error saving auth state to sessionStorage:", error);
  }
};

// Load authentication state from sessionStorage
export const loadAuthState = (): PersistedAuthState | null => {
  try {
    const serializedState = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (serializedState === null) {
      console.log("No persisted auth state found");
      return null;
    }
    const parsedState = JSON.parse(serializedState);
    
    // Don't restore empty module arrays
    if (parsedState.configuredModules && parsedState.configuredModules.length === 0) {
      parsedState.configuredModules = null;
    }
    
    console.log("Auth state loaded from sessionStorage:", parsedState);
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
    console.log("Persisted auth state cleared");
  } catch (error) {
    console.error("Error clearing persisted auth state:", error);
  }
};
