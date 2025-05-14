
import React, { createContext, useContext, useState, useEffect } from 'react';
import { EmployeeVerificationContextType, EmployeeVerificationProviderProps } from './types';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { useDocumentManagement } from './hooks/useDocumentManagement';
import { DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';
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
  const [isStatusLoading, setIsStatusLoading] = useState(false);
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

  // New function to get a document by ID
  const getDocument = (documentId: string): VerificationDocument => {
    const foundDocument = documents.find(doc => doc.id === documentId);
    if (!foundDocument) {
      console.error(`Document with ID ${documentId} not found`);
      // Return a default document to prevent errors
      return {
        id: documentId,
        employeeId: '',
        documentTypeId: '',
        documentImage: '',
        verificationStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return foundDocument;
  };

  // Load document statuses only once when component mounts
  useEffect(() => {
    if (!documentStatusesLoaded && !isStatusLoading) {
      fetchDocumentStatuses();
    }
  }, [documentStatusesLoaded, isStatusLoading]);

  const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
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
  };

  const fetchDocumentStatuses = async (): Promise<DocumentStatus[]> => {
    if (documentStatusesLoaded && documentStatuses.length > 0) {
      return documentStatuses;
    }

    try {
      setIsStatusLoading(true);
      console.log('Fetching document statuses from the database...');
      
      const { data, error } = await supabase
        .from('document_status')
        .select('*');
      
      if (error) {
        console.error('Error fetching document statuses:', error);
        setIsStatusLoading(false);
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
      setIsStatusLoading(false);
      return statusesData;
    } catch (error) {
      console.error('Failed to fetch document statuses:', error);
      setIsStatusLoading(false);
      return documentStatuses;
    }
  };

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
        getDocument,
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
