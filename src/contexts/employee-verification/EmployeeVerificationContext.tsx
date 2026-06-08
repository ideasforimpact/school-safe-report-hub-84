import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
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

// Module-level guards — survive context remounts so reference data is fetched only once per app session
let docRefDataInflight: Promise<void> | null = null;
let docRefDataFetched = false;

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
    isLoading: isEmployeeLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    fetchEmployees,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    totalEmployeesCount,
    verifiedEmployeesCount,
  } = useEmployeeManagement();

  // Update employee status based on document verifications
  const updateEmployeeStatus = useCallback(async (employeeId: string, status: boolean) => {
    try {
      await updateEmployee(employeeId, { status });
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

  // Combined call — fetches documentTypes + documentStatuses in one request.
  // Uses module-level guards so the fetch survives context remounts and fires only once per session.
  const fetchDocumentReferenceData = useCallback(async () => {
    // Already fetched this session — return immediately
    if (docRefDataFetched) return;
    // Attach to the in-flight request if one is already running
    if (docRefDataInflight) return docRefDataInflight;

    docRefDataInflight = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('employee-documents', {
          body: { action: 'getDocumentReferenceData' },
        });
        if (error) throw error;

        const mappedTypes: DocumentType[] = (data?.documentTypes || []).map((type: any) => ({
          id: type.id,
          name: type.name,
          description: type.description || '',
          createdAt: type.created_at,
          updatedAt: type.updated_at,
        }));
        if (mappedTypes.length > 0) setDocumentTypes(mappedTypes);

        const mappedStatuses: DocumentStatus[] = (data?.documentStatuses || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));
        setDocumentStatuses(mappedStatuses.length > 0 ? mappedStatuses : initialDocumentStatuses);
        docRefDataFetched = true;
      } catch (err) {
        console.error('Failed to fetch document reference data:', err);
      } finally {
        docRefDataInflight = null;
      }
    })();
    return docRefDataInflight;
  }, []);

  // Aliases kept for backward compatibility with existing callers
  const fetchDocumentTypes = fetchDocumentReferenceData;
  const fetchDocumentStatuses = fetchDocumentReferenceData;

  const verifyEmployee = async (employeeId: string): Promise<boolean> => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: { operation: 'find_by_employee_id', employeeId },
      });

      if (error) {
        console.error('Error verifying employee:', error.message);
        setVerificationError('Could not verify employee ID. Please try again.');
        toast.error('Employee verification failed');
        return false;
      }

      if (!data?.found) {
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

    currentPage,
    totalPages,
    totalCount,
    pageSize,
    totalEmployeesCount,
    verifiedEmployeesCount,

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

    isLoading: isLoading || isEmployeeLoading || isDocumentLoading,
  }), [
    isVerifying, verificationError,
    employees, addEmployee, updateEmployee, deleteEmployee, getEmployee, fetchEmployees,
    currentPage, totalPages, totalCount, pageSize, totalEmployeesCount, verifiedEmployeesCount,
    documents, addDocument, verifyDocument, deleteDocument, getEmployeeDocuments, fetchEmployeeDocuments,
    documentTypes, documentStatuses, fetchDocumentTypes, fetchDocumentStatuses,
    isLoading, isEmployeeLoading, isDocumentLoading,
  ]);

  // Fetch initial reference data when entering the employee verification route — single combined call
  useEffect(() => {
    if (isUsersRoute || !isEmployeeVerificationRoute) return;
    fetchDocumentReferenceData();
  }, [isUsersRoute, isEmployeeVerificationRoute, fetchDocumentReferenceData]);

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
