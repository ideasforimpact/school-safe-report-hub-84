import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
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
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useLocation } from 'react-router-dom';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialDocumentTypes);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>(initialDocumentStatuses);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});
  const location = useLocation();
  const isUsersRoute = location.pathname === '/users';
  const isEmployeeVerificationRoute =
    location.pathname.startsWith('/employee-verification') ||
    location.pathname.startsWith('/backoffice/employee-verification') ||
    location.pathname.startsWith('/backoffice-employee-verification');

  // Use the employee management hook
  const { 
    employees, 
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    fetchEmployees
  } = useEmployeeManagement();

  // Update employee status based on document verifications
  const updateEmployeeStatus = useCallback(async (employeeId: string, status: boolean) => {
    try {
      await updateEmployee(employeeId, { status });
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  }, [updateEmployee]);

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

  // Fetch document types from the database with cache control
  const fetchDocumentTypes = useCallback(async () => {
    // Check if we've fetched document types in the last minute
    const now = Date.now();
    if (lastFetchTime.documentTypes && now - lastFetchTime.documentTypes < 60000) {
      console.log('Skipping document types fetch - recently fetched');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔍 Fetching document types from database...');
      const { data, error } = await supabase
        .from('employee_document_type')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching document types:', error);
        // Clear cache on error so we can retry
        setLastFetchTime(prev => ({ ...prev, documentTypes: 0 }));
        return;
      }
      
      console.log('📊 Raw document types from DB:', data);
      
      // Map database fields to our DocumentType interface
      const mappedDocumentTypes: DocumentType[] = data.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description || '',
        createdAt: type.created_at,
        updatedAt: type.updated_at
      }));
      
      console.log('📋 Mapped document types:', mappedDocumentTypes);
      
      if (mappedDocumentTypes.length > 0) {
        setDocumentTypes(mappedDocumentTypes);
        setLastFetchTime(prev => ({ ...prev, documentTypes: now }));
        console.log('✅ Document types set successfully');
      } else {
        console.warn('⚠️ No document types found in database, clearing cache to allow retry');
        // Clear cache if no data found so we can retry
        setLastFetchTime(prev => ({ ...prev, documentTypes: 0 }));
      }
    } catch (err) {
      console.error('Failed to fetch document types:', err);
      // Clear cache on error so we can retry
      setLastFetchTime(prev => ({ ...prev, documentTypes: 0 }));
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime]);

  // Fetch document statuses from the database with cache control
  const fetchDocumentStatuses = useCallback(async () => {
    // Check if we've fetched document statuses in the last minute
    const now = Date.now();
    if (lastFetchTime.documentStatuses && now - lastFetchTime.documentStatuses < 60000) {
      console.log('Skipping document statuses fetch - recently fetched');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_status')
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
      setLastFetchTime(prev => ({ ...prev, documentStatuses: now }));
    } catch (err) {
      console.error('Failed to fetch document statuses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime]);

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

  // Use memoized value for context to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Original verification context values
    verifyEmployee,
    isVerifying,
    verificationError,
    
    // Employee management
    employees,
    addEmployee,
    updateEmployee,
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
  }), [
    verifyEmployee, isVerifying, verificationError,
    employees, addEmployee, updateEmployee, deleteEmployee, getEmployee, fetchEmployees,
    documents, addDocument, verifyDocument, deleteDocument, getEmployeeDocuments, fetchEmployeeDocuments,
    documentTypes, documentStatuses, fetchDocumentTypes, fetchDocumentStatuses,
    isLoading, isDocumentLoading
  ]);

  // Fetch initial data when the context mounts, but only once
  useEffect(() => {
    if (isUsersRoute || !isEmployeeVerificationRoute) {
      return;
    }
    fetchDocumentTypes();
    fetchDocumentStatuses();
  }, [isUsersRoute, isEmployeeVerificationRoute, fetchDocumentTypes, fetchDocumentStatuses]);
  const handleEmployeeDocumentsRealtime = useCallback(
    (payload: any) => {
      const employeeId = payload.new?.employee_id || payload.old?.employee_id;
      if (!employeeId) return;
      fetchEmployeeDocuments(employeeId);
    },
    [fetchEmployeeDocuments]
  );
  useRealTimeSubHook({
  channelName: 'employee-documents-realtime',
  table: 'employee_documents',
  events: "*",
  enabled: true,
  onPayload:handleEmployeeDocumentsRealtime,
});

  return (
    <EmployeeVerificationContext.Provider value={contextValue}>
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
