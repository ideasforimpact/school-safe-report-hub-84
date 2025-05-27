
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: boolean | string;
}

interface EmployeeVerificationContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
}

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};

interface EmployeeVerificationProviderProps {
  children: ReactNode;
}

export const EmployeeVerificationProvider: React.FC<EmployeeVerificationProviderProps> = ({ children }) => {
  const [employees] = useState<Employee[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const value = {
    employees,
    loading,
    error,
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};
