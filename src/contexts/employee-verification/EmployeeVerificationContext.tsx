
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initialData } from './initialData';
import { 
  EmployeeVerificationContextType,
  VerificationEmployee,
  EmployeeDocument,
  DocumentType,
  DocumentStatus
} from './types';

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType>({
  employees: [],
  documents: [],
  documentTypes: [],
  documentStatuses: [],
  loading: false,
  fetchEmployees: async () => {},
  getEmployee: () => null,
  addEmployee: async () => ({ success: false }),
  updateEmployee: async () => ({ success: false }),
  deleteEmployee: async () => ({ success: false }),
  getEmployeeDocuments: () => [],
  fetchEmployeeDocuments: async () => {},
  addDocument: async () => ({ success: false }),
  updateDocument: async () => ({ success: false }),
  deleteDocument: async () => ({ success: false }),
  verifyDocument: async () => ({ success: false }),
  fetchDocumentTypes: async () => {},
  fetchDocumentStatuses: async () => {}
});

export const useEmployeeVerification = () => useContext(EmployeeVerificationContext);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<VerificationEmployee[]>(initialData.employees);
  const [documents, setDocuments] = useState<EmployeeDocument[]>(initialData.documents);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialData.documentTypes);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>(initialData.documentStatuses);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('lastName', { ascending: true });
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const getEmployee = useCallback((id: string) => {
    return employees.find(emp => emp.id === id) || null;
  }, [employees]);

  const addEmployee = async (employee: Omit<VerificationEmployee, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select();
      
      if (error) throw error;
      const newEmployee = data[0] as VerificationEmployee;
      setEmployees(prev => [...prev, newEmployee]);
      toast.success('Employee added successfully');
      return { success: true, data: newEmployee };
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
      return { success: false, error };
    }
  };

  const updateEmployee = async (id: string, updates: Partial<VerificationEmployee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      const updatedEmployee = data[0] as VerificationEmployee;
      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
      toast.success('Employee updated successfully');
      return { success: true, data: updatedEmployee };
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
      return { success: false, error };
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      // Also delete related documents
      setDocuments(prev => prev.filter(doc => doc.employeeId !== id));
      toast.success('Employee deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
      return { success: false, error };
    }
  };

  const getEmployeeDocuments = useCallback((employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  }, [documents]);

  const fetchEmployeeDocuments = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employeeId', employeeId);
      
      if (error) throw error;
      
      // Update only this employee's documents in the state
      setDocuments(prev => {
        const otherDocs = prev.filter(doc => doc.employeeId !== employeeId);
        return [...otherDocs, ...(data || [])];
      });
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      toast.error('Failed to load employee documents');
    } finally {
      setLoading(false);
    }
  };

  const verifyDocument = async (documentId: string, status: string, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update({ 
          status,
          verificationNotes: notes || null,
          verifiedAt: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select();
      
      if (error) throw error;
      
      const updatedDoc = data[0] as EmployeeDocument;
      setDocuments(prev => prev.map(doc => doc.id === documentId ? updatedDoc : doc));
      
      toast.success(`Document ${status === 'verified' ? 'verified' : 'verification failed'}`);
      return { success: true, data: updatedDoc };
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to update document verification status');
      return { success: false, error };
    }
  };

  const addDocument = async (document: Omit<EmployeeDocument, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .insert([document])
        .select();
      
      if (error) throw error;
      
      const newDocument = data[0] as EmployeeDocument;
      setDocuments(prev => [...prev, newDocument]);
      toast.success('Document added successfully');
      return { success: true, data: newDocument };
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
      return { success: false, error };
    }
  };

  const updateDocument = async (id: string, updates: Partial<EmployeeDocument>) => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      const updatedDocument = data[0] as EmployeeDocument;
      setDocuments(prev => prev.map(doc => doc.id === id ? updatedDocument : doc));
      toast.success('Document updated successfully');
      return { success: true, data: updatedDocument };
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
      return { success: false, error };
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      return { success: false, error };
    }
  };

  const fetchDocumentTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast.error('Failed to load document types');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentStatuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_statuses')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDocumentStatuses(data || []);
    } catch (error) {
      console.error('Error fetching document statuses:', error);
      toast.error('Failed to load document statuses');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    employees,
    documents,
    documentTypes,
    documentStatuses,
    loading,
    fetchEmployees,
    getEmployee,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    verifyDocument,
    fetchDocumentTypes,
    fetchDocumentStatuses
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};
