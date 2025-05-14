
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EmployeeVerificationContextType } from './types';
import { 
  useEmployeeManagement, 
  useDocumentManagement 
} from './hooks';
import { initialEmployees, initialDocuments } from './initialData';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [documents, setDocuments] = useState(initialDocuments);

  const employeeManagement = useEmployeeManagement(employees, setEmployees);
  const documentManagement = useDocumentManagement(documents, setDocuments);

  const value: EmployeeVerificationContextType = {
    ...employeeManagement,
    ...documentManagement,
    employees,
    documents,
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};

