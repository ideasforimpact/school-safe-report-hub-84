
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  EmployeeVerificationContextType,
  Employee, 
  DocumentType, 
  DocumentStatus,
  VerificationDocument
} from './types';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { useDocumentManagement } from './hooks/useDocumentManagement';
import { initialDocumentTypes, initialDocumentStatuses } from './initialData';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialDocumentTypes);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>(initialDocumentStatuses);
  const [isLoading, setIsLoading] = useState(false);

  // Use the employee management hook
  const { 
    employees, 
    addEmployee,
    updateEmployee: updateEmployeeData,
    deleteEmployee,
    getEmployee,
    fetchEmployees
  } = useEmployeeManagement();

  // Update employee status based on document verifications
  const updateEmployeeStatus = useCallback(async (employeeId: string, status: 'pending' | 'verified' | 'failed') => {
    try {
      await updateEmployeeData(employeeId, { status });
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  }, [updateEmployeeData]);

  // Use the document management hook
  const { 
    documents, 
    addDocument,
    verifyDocument,
    deleteDocument,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    isLoading: isDocumentLoading
  } = useDocumentManagement(updateEmployeeStatus);

  // Fetch document types from the database
  const fetchDocumentTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_document_type')  // Use the correct table name
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching document types:', error);
        return;
      }
      
      // Map database fields to our DocumentType interface
      const mappedDocumentTypes: DocumentType[] = data.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description || '',
        createdAt: type.created_at,
        updatedAt: type.updated_at
      }));
      
      setDocumentTypes(mappedDocumentTypes.length > 0 ? mappedDocumentTypes : initialDocumentTypes);
    } catch (err) {
      console.error('Failed to fetch document types:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch document statuses from the database
  const fetchDocumentStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_status')  // Use the correct table name
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching document statuses:', error);
        return;
      }
      
      // Map database fields to our DocumentStatus interface
      const mappedDocumentStatuses: DocumentStatus[] = data.map(status => ({
        id: status.id,
        name: status.name,
        description: status.description || '',
        createdAt: status.created_at,
        updatedAt: status.updated_at
      }));
      
      setDocumentStatuses(mappedDocumentStatuses.length > 0 ? mappedDocumentStatuses : initialDocumentStatuses);
    } catch (err) {
      console.error('Failed to fetch document statuses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify employee (this is the original function from the context)
  const verifyEmployee = async (employeeId: string): Promise<boolean> => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      
      if (error) {
        console.error('Error verifying employee:', error.message);
        setVerificationError('Could not verify employee ID. Please try again.');
        toast.error('Employee verification failed');
        return false;
      }
      
      if (!data) {
        setVerificationError('Employee not found with the provided ID.');
        toast.error('Employee not found');
        return false;
      }
      
      toast.success('Employee verified successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      setVerificationError('An unexpected error occurred. Please try again.');
      toast.error('Verification error');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch initial data when the context mounts
  useEffect(() => {
    fetchDocumentTypes();
    fetchDocumentStatuses();
  }, [fetchDocumentTypes, fetchDocumentStatuses]);

  // Create the context value
  const value: EmployeeVerificationContextType = {
    // Original verification context values
    verifyEmployee,
    isVerifying,
    verificationError,
    
    // Employee management
    employees,
    addEmployee,
    updateEmployee: updateEmployeeData,
    deleteEmployee,
    getEmployee,
    fetchEmployees,
    
    // Document management
    documents,
    addDocument,
    verifyDocument,
    deleteDocument,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    
    // Document types and statuses
    documentTypes,
    documentStatuses,
    fetchDocumentTypes,
    fetchDocumentStatuses,
    
    // Loading state
    isLoading: isLoading || isDocumentLoading
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
