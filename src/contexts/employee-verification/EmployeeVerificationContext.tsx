
import React, { createContext, useContext } from 'react';
import { EmployeeVerificationContextType, EmployeeVerificationProviderProps } from './types';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { useDocumentManagement } from './hooks/useDocumentManagement';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (!context) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};

export const EmployeeVerificationProvider: React.FC<EmployeeVerificationProviderProps> = ({ children }) => {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    getEmployee,
    fetchEmployees
  } = useEmployeeManagement();

  const {
    documents,
    addDocument,
    verifyDocument,
    deleteDocument,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    isLoading
  } = useDocumentManagement((employeeId, status) => {
    updateEmployee(employeeId, { status });
  });

  return (
    <EmployeeVerificationContext.Provider
      value={{
        employees,
        documents,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addDocument,
        verifyDocument,
        deleteDocument,
        getEmployeeDocuments,
        getEmployee,
        fetchEmployees,
        fetchEmployeeDocuments,
        isLoading
      }}
    >
      {children}
    </EmployeeVerificationContext.Provider>
  );
};
