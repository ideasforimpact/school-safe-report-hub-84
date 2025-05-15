
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { EmployeeVerificationContextType, VerificationDocument, Employee, DocumentType, DocumentStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { useDocumentManagement } from './hooks/useDocumentManagement';
import { initialEmployees, initialDocuments, initialDocumentTypes, initialDocumentStatuses } from './initialData';

// Create context with default values
const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

// Provider component
export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialDocumentTypes);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>(initialDocumentStatuses);
  const [isLoading, setIsLoading] = useState(false);

  // Update employee status based on documents
  const updateEmployeeStatus = useCallback(async (employeeId: string, status: 'pending' | 'verified' | 'failed') => {
    await updateEmployee(employeeId, { status });
  }, []);

  // Use employee management hook
  const { 
    employees, 
    fetchEmployees, 
    getEmployee, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee 
  } = useEmployeeManagement();

  // Use document management hook
  const { 
    documents, 
    fetchEmployeeDocuments, 
    getEmployeeDocuments, 
    addDocument, 
    verifyDocument, 
    deleteDocument 
  } = useDocumentManagement(updateEmployeeStatus);

  // Fetch document types
  const fetchDocumentTypes = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employee_document_type')
        .select('*');

      if (error) throw error;

      if (data) {
        const mappedTypes = data.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description || '',
          createdAt: type.created_at,
          updatedAt: type.updated_at
        }));
        setDocumentTypes(mappedTypes);
        return mappedTypes;
      }
      return documentTypes;
    } catch (error) {
      console.error('Error fetching document types:', error);
      return documentTypes;
    } finally {
      setIsLoading(false);
    }
  }, [documentTypes]);

  // Fetch document statuses
  const fetchDocumentStatuses = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('document_status')
        .select('*');

      if (error) throw error;

      if (data) {
        const mappedStatuses = data.map(status => ({
          id: status.id,
          name: status.name,
          description: status.description || '',
          createdAt: status.created_at,
          updatedAt: status.updated_at
        }));
        setDocumentStatuses(mappedStatuses);
        return mappedStatuses;
      }
      return documentStatuses;
    } catch (error) {
      console.error('Error fetching document statuses:', error);
      return documentStatuses;
    } finally {
      setIsLoading(false);
    }
  }, [documentStatuses]);

  const value: EmployeeVerificationContextType = {
    isLoading,
    employees,
    documents,
    documentTypes,
    documentStatuses,
    fetchEmployees,
    getEmployee,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployeeDocuments,
    fetchDocumentTypes,
    fetchDocumentStatuses,
    getEmployeeDocuments,
    addDocument,
    verifyDocument,
    deleteDocument
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

// Custom hook for using the context
export const useEmployeeVerification = (): EmployeeVerificationContextType => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};
