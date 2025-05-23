import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerificationDocument } from '../types';
import { toast } from 'sonner';

export const useDocumentManagement = (
  updateEmployeeStatus: (employeeId: string, status: boolean) => Promise<boolean>
) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add a document
  const addDocument = useCallback(async (document: Partial<VerificationDocument>, file: File): Promise<VerificationDocument | null> => {
    setIsLoading(true);
    try {
      // Implementation of adding document
      // This is a placeholder - actual implementation would depend on your API
      const newDocument = { ...document, id: `doc-${Date.now()}` } as VerificationDocument;
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (error) {
      console.error('Error adding document:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Verify a document
  const verifyDocument = useCallback(async (documentId: string, status: 'verified' | 'failed', notes: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Implementation of verifying document
      // This is a placeholder - actual implementation would depend on your API
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, verificationStatus: status, verificationNotes: notes } 
          : doc
      ));
      return true;
    } catch (error) {
      console.error('Error verifying document:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Delete a document
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Implementation of deleting document
      // This is a placeholder - actual implementation would depend on your API
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get documents for an employee
  const getEmployeeDocuments = useCallback((employeeId: string): VerificationDocument[] => {
    return documents.filter(doc => doc.employeeId === employeeId);
  }, [documents]);
  
  // Fetch documents for an employee
  const fetchEmployeeDocuments = useCallback(async (employeeId: string): Promise<VerificationDocument[]> => {
    setIsLoading(true);
    try {
      // Implementation of fetching employee documents
      // This is a placeholder - actual implementation would depend on your API
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId);
      
      if (error) {
        throw error;
      }
      
      const fetchedDocuments = data.map(doc => ({
        id: doc.id,
        employeeId: doc.employee_id,
        documentTypeId: doc.document_type_id,
        documentTypeName: doc.document_type_name,
        documentNumber: doc.document_number,
        documentImage: doc.document_image,
        verificationStatus: doc.verification_status,
        documentStatusId: doc.document_status_id,
        documentStatusName: doc.document_status_name,
        verificationDate: doc.verification_date,
        verificationNotes: doc.verification_notes,
        verificationMethod: doc.verification_method,
        employee_docs_log: doc.employee_docs_log,
        details: doc.details,
        params: doc.params,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      })) as VerificationDocument[];
      
      setDocuments(fetchedDocuments);
      return fetchedDocuments;
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      toast.error('Failed to fetch employee documents');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    documents,
    addDocument,
    verifyDocument,
    deleteDocument,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    isLoading
  };
};
