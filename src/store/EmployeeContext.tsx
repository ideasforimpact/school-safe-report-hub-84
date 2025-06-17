
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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

  // Persist authentication state changes to sessionStorage
  useEffect(() => {
    // Only persist authentication-related state
    const authState = {
      currentUser: state.currentUser,
      isAuthenticated: state.isAuthenticated,
      isBackofficeUser: state.isBackofficeUser,
      authError: state.authError
    };

    // Only save if we have a meaningful authentication state
    if (state.currentUser || state.isBackofficeUser || state.isAuthenticated) {
      saveAuthState(authState);
    } else if (!state.currentUser && !state.isBackofficeUser && !state.isAuthenticated) {
      // Clear persisted state if user is logged out
      clearPersistedAuthState();
    }
  }, [state.currentUser, state.isAuthenticated, state.isBackofficeUser, state.authError]);

  return (
    <EmployeeContext.Provider value={{ state, dispatch }}>
      {children}
    </EmployeeContext.Provider>
  );
};
