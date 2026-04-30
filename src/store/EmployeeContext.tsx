
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { employeeReducer, initialEmployeeState } from './employeeReducer';
import { EmployeeState, EmployeeAction } from './types';
import { saveAuthState, clearPersistedAuthState } from './authPersistence';

interface EmployeeContextType {
  state: EmployeeState;
  dispatch: React.Dispatch<EmployeeAction>;
}

// Create context with default value to avoid the 'undefined' error
const defaultContextValue: EmployeeContextType = {
  state: initialEmployeeState,
  dispatch: () => null // This will be replaced by the actual dispatch function
};

const EmployeeContext = createContext<EmployeeContextType>(defaultContextValue);

export const useEmployeeStore = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployeeStore must be used within an EmployeeProvider');
  }
  return context;
};

interface EmployeeProviderProps {
  children: ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialEmployeeState);
  
  // Refs to track persistence state and prevent infinite loops
  const hasClearedRef = useRef(false);
  const lastPersistedStateRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Persist authentication state changes to sessionStorage
  useEffect(() => {
    // Skip during initial render to prevent unnecessary operations
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // Create current auth state
    const authState = {
      currentUser: state.currentUser,
      isAuthenticated: state.isAuthenticated,
      isBackofficeUser: state.isBackofficeUser,
      authError: state.authError,
      configuredModules: state.configuredModules,
      employeeData: state.employeeData,
      activeClientId: state.activeClientId,
      isSwitchedContext: state.isSwitchedContext,
      clientManagementReadOnly: state.clientManagementReadOnly,
      switchedAccessLevel: state.switchedAccessLevel,
    };

    // Create a hash of the current state to compare changes
    const currentStateHash = JSON.stringify(authState);
    
    // Skip if state hasn't actually changed
    if (currentStateHash === lastPersistedStateRef.current) {
      return;
    }

    // Check if we have a meaningful authentication state
    const hasValidAuthState = state.currentUser || 
                             state.isBackofficeUser || 
                             state.isAuthenticated || 
                             state.employeeData || 
                             (state.configuredModules && state.configuredModules.length > 0);

    if (hasValidAuthState) {
      // Save the state and update our tracking
      saveAuthState(authState);
      lastPersistedStateRef.current = currentStateHash;
      hasClearedRef.current = false; // Reset clear flag when we have valid state
    } else {
      // Only clear if we haven't already cleared and we previously had valid state
      const hadValidState = lastPersistedStateRef.current !== '' && lastPersistedStateRef.current !== '{}';
      
      if (!hasClearedRef.current && hadValidState) {
        clearPersistedAuthState();
        hasClearedRef.current = true;
        lastPersistedStateRef.current = currentStateHash;
      }
    }
  }, [
    state.currentUser, 
    state.isAuthenticated, 
    state.isBackofficeUser, 
    state.authError, 
    state.configuredModules, 
    state.employeeData,
    state.activeClientId,
    state.isSwitchedContext,
    state.clientManagementReadOnly,
    state.switchedAccessLevel,
  ]);

  return (
    <EmployeeContext.Provider value={{ state, dispatch }}>
      {children}
    </EmployeeContext.Provider>
  );
};
