
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeVerificationContextType } from './types';
import { Employee, VerificationDocument, DocumentType, DocumentStatus } from '@/types/employeeVerification';
import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { useDocumentManagement } from './hooks/useDocumentManagement';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update employee status based on document verification
  const updateEmployeeStatus = useCallback(async (employeeId: string, status: 'pending' | 'verified' | 'failed') => {
    try {
      const employeeToUpdate = employeeManagement.getEmployee(employeeId);
      if (employeeToUpdate) {
        await employeeManagement.updateEmployee(employeeId, { status });
      }
    } catch (error) {
      console.error("Error updating employee status:", error);
    }
  }, []);

  // Use custom hooks for employee and document management
  const employeeManagement = useEmployeeManagement();
  const documentManagement = useDocumentManagement(updateEmployeeStatus);

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

  // Fetch document types from the database
  const fetchDocumentTypes = useCallback(async (): Promise<DocumentType[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_document_type')
        .select('*');
      
      if (error) {
        console.error('Error fetching document types:', error);
        return [];
      }
      
      const fetchedDocumentTypes = data as DocumentType[];
      setDocumentTypes(fetchedDocumentTypes);
      return fetchedDocumentTypes;
    } catch (error) {
      console.error('Unexpected error fetching document types:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch document statuses from the database
  const fetchDocumentStatuses = useCallback(async (): Promise<DocumentStatus[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_status')
        .select('*');
      
      if (error) {
        console.error('Error fetching document statuses:', error);
        return [];
      }
      
      const fetchedDocumentStatuses = data as DocumentStatus[];
      setDocumentStatuses(fetchedDocumentStatuses);
      return fetchedDocumentStatuses;
    } catch (error) {
      console.error('Unexpected error fetching document statuses:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: EmployeeVerificationContextType = {
    // Basic verification
    verifyEmployee,
    isVerifying,
    verificationError,
    
    // Employee management
    ...employeeManagement,
    
    // Document management
    ...documentManagement,
    
    // Document types and statuses
    documentTypes,
    documentStatuses,
    fetchDocumentTypes,
    fetchDocumentStatuses,
    
    // Loading state
    isLoading: isLoading || documentManagement.isLoading
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
