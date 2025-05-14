
import React, { createContext, useContext, useState } from 'react';
import { EmployeeVerificationContextType } from './types';

// Create the context with a default value
const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

// Provider component
export const EmployeeVerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // For now, provide minimal implementation
  const value: EmployeeVerificationContextType = {
    employees,
    documents,
    isLoading,
    error
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

// Custom hook to use the context
export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};
