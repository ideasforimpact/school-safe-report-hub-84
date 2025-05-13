
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialEmployees } from './initialData';
import { Employee, VerificationDocument, DocumentType } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import { useDocumentManagement } from './hooks/useDocumentManagement';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeVerificationContextType {
  employees: Employee[];
  documentTypes: DocumentType[];
  getEmployee: (id: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  updateEmployeeStatus: (employeeId: string, status: 'pending' | 'verified' | 'failed') => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchDocumentTypes: () => Promise<void>;
  fetchDocumentStatuses: () => Promise<void>;
  documents: VerificationDocument[];
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  isLoading: boolean;
}

export const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(false);
  const { toast } = useToast();

  const updateEmployeeStatus = useCallback(async (employeeId: string, status: 'pending' | 'verified' | 'failed') => {
    try {
      // In a real app, we would call the API to update the employee status in the database
      setEmployees(prevEmployees => prevEmployees.map(employee => 
        employee.id === employeeId ? { ...employee, status } : employee
      ));
      console.log(`Employee ${employeeId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating employee status:", error);
      throw error;
    }
  }, []);

  const { 
    documents, 
    addDocument, 
    verifyDocument, 
    deleteDocument,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    isLoading: isLoadingDocuments
  } = useDocumentManagement(updateEmployeeStatus);

  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    try {
      // Here we would fetch employees from the server
      // For now, we're just using the initial data
      setEmployees(initialEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [toast]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      // Call the edge function to get document types
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: { action: 'getDocumentTypes' }
      });

      if (error) {
        throw error;
      }

      if (data?.documentTypes) {
        setDocumentTypes(data.documentTypes);
      }
    } catch (error) {
      console.error("Error fetching document types:", error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document types',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchDocumentStatuses = useCallback(async () => {
    try {
      // Call the edge function to get document statuses
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: { action: 'getDocumentStatuses' }
      });

      if (error) {
        throw error;
      }

      console.log("Fetched document statuses:", data?.documentStatuses);
    } catch (error) {
      console.error("Error fetching document statuses:", error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchDocumentTypes();
    fetchDocumentStatuses();
  }, [fetchEmployees, fetchDocumentTypes, fetchDocumentStatuses]);

  const getEmployee = useCallback((id: string) => {
    return employees.find(e => e.id === id);
  }, [employees]);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...employeeData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const updateEmployee = useCallback(async (id: string, data: Partial<Employee>) => {
    setEmployees(prev => 
      prev.map(employee => 
        employee.id === id 
          ? { ...employee, ...data, updatedAt: new Date().toISOString() } 
          : employee
      )
    );
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
  }, []);

  const isLoading = isLoadingEmployees || isLoadingDocuments;

  const value = {
    employees,
    documentTypes,
    getEmployee,
    addEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
    documents,
    getEmployeeDocuments,
    fetchDocumentTypes,
    fetchDocumentStatuses,
    addDocument,
    verifyDocument,
    deleteDocument,
    fetchEmployeeDocuments,
    isLoading
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
