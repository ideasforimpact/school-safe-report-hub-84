
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { employeeReducer, initialEmployeeState } from './employeeReducer';
import { EmployeeState, EmployeeAction } from './types';

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

  return (
    <EmployeeContext.Provider value={{ state, dispatch }}>
      {children}
    </EmployeeContext.Provider>
  );
};
