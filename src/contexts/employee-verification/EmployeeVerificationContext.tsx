
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { EmployeeVerificationContextType, EmployeeVerificationProviderProps } from './types';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { useDocumentManagement } from './hooks/useDocumentManagement';
import { DocumentType, DocumentStatus } from '@/types/employeeVerification';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (!context) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};

export const EmployeeVerificationProvider: React.FC<EmployeeVerificationProviderProps> = ({ children }) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [documentTypesLoaded, setDocumentTypesLoaded] = useState(false);
  const [documentStatusesLoaded, setDocumentStatusesLoaded] = useState(false);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const statusFetchingRef = useRef<boolean>(false);
  const { toast } = useToast();
  
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
  } = useDocumentManagement(async (employeeId, status) => {
    await updateEmployee(employeeId, { status });
    return Promise.resolve();
  });

  // Load document statuses when component mounts - with debounce protection
  useEffect(() => {
    // Only fetch if we haven't already loaded statuses and we're not currently fetching
    if (!documentStatusesLoaded && !statusFetchingRef.current) {
      fetchDocumentStatuses()
        .catch(error => {
          console.error('Error loading document statuses:', error);
          toast({
            title: "Error",
            description: "Failed to load document statuses",
            variant: "destructive"
          });
        });
    }
  }, [documentStatusesLoaded, toast]);

  const fetchDocumentTypes = useCallback(async (): Promise<DocumentType[]> => {
    // If document types have already been loaded, don't fetch again
    if (documentTypesLoaded && documentTypes.length > 0) {
      return documentTypes;
    }
    
    try {
      const { data, error } = await supabase
        .from('employee_document_type')
        .select('*');
      
      if (error) {
        console.error('Error fetching document types:', error);
        return [];
      }
      
      const typesData = data.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        createdAt: type.created_at,
        updatedAt: type.updated_at
      }));
      
      setDocumentTypes(typesData);
      setDocumentTypesLoaded(true);
      return typesData;
    } catch (error) {
      console.error('Failed to fetch document types:', error);
      return [];
    }
  }, [documentTypes, documentTypesLoaded]);

  const fetchDocumentStatuses = useCallback(async (): Promise<DocumentStatus[]> => {
    // If we're already loading statuses or they're already loaded, return current state
    if (isLoadingStatuses || (documentStatusesLoaded && documentStatuses.length > 0)) {
      return documentStatuses;
    }

    // Set the loading flag and prevent concurrent fetches
    setIsLoadingStatuses(true);
    statusFetchingRef.current = true;
    
    try {
      console.log('Fetching document statuses from the database...');
      
      const { data, error } = await supabase
        .from('document_status')
        .select('*');
      
      if (error) {
        console.error('Error fetching document statuses:', error);
        return documentStatuses;
      }
      
      const statusesData = data.map(status => ({
        id: status.id,
        name: status.name,
        description: status.description,
        createdAt: status.created_at,
        updatedAt: status.updated_at
      })) as DocumentStatus[];
      
      console.log('Document statuses fetched successfully:', statusesData);
      
      setDocumentStatuses(statusesData);
      setDocumentStatusesLoaded(true);
      return statusesData;
    } catch (error) {
      console.error('Failed to fetch document statuses:', error);
      return documentStatuses;
    } finally {
      setIsLoadingStatuses(false);
      statusFetchingRef.current = false;
    }
  }, [documentStatuses, documentStatusesLoaded, isLoadingStatuses]);

  return (
    <EmployeeVerificationContext.Provider
      value={{
        employees,
        documents,
        documentTypes,
        documentStatuses,
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
        fetchDocumentTypes,
        fetchDocumentStatuses,
        isLoading
      }}
    >
      {children}
    </EmployeeVerificationContext.Provider>
  );
};
