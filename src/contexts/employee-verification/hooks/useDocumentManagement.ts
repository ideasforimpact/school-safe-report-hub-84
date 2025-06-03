import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerificationDocument } from '../types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

export const useDocumentManagement = (updateEmployeeStatus: (employeeId: string, status: boolean) => Promise<void>) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, employeeData } = useAuth();

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  const fetchEmployeeDocuments = useCallback(async (employeeId: string) => {
    if (!clientId) {
      console.log('No client ID available - cannot fetch documents');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching documents for employee:', employeeId, 'client:', clientId);
      
      // First verify the employee belongs to the current client
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, client_id')
        .eq('id', employeeId)
        .eq('client_id', clientId)
        .single();

      if (empError || !employee) {
        console.error('Employee not found or does not belong to current client');
        return;
      }

      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          id,
          employee_id,
          document_type_id,
          document_status_id,
          document_url,
          document_number,
          verification_status,
          params,
          employee_docs_log,
          last_otp_generated,
          created_at,
          updated_at,
          document_type:employee_document_type(name, description),
          document_status:document_status(name, description)
        `)
        .eq('employee_id', employeeId);

      if (error) {
        console.error('Error fetching employee documents:', error);
        return;
      }

      const formattedDocuments: VerificationDocument[] = data.map(doc => ({
        id: doc.id,
        employeeId: doc.employee_id,
        documentTypeId: doc.document_type_id,
        documentImage: doc.document_url,
        documentNumber: doc.document_number || '',
        verificationStatus: (doc.verification_status as 'verified' | 'failed' | 'pending') || 'pending',
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        expiryDate: (doc.params as any)?.expiryDate || null,
        verificationDate: null,
        verificationNotes: '',
        verificationMethod: 'manual'
      }));

      console.log('Fetched documents:', formattedDocuments);
      setDocuments(prev => {
        const filtered = prev.filter(d => d.employeeId !== employeeId);
        return [...filtered, ...formattedDocuments];
      });
    } catch (error) {
      console.error('Error in fetchEmployeeDocuments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const addDocument = useCallback(async (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientId) {
      toast.error('No client context available');
      return;
    }

    try {
      // Verify the employee belongs to the current client
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, client_id')
        .eq('id', document.employeeId)
        .eq('client_id', clientId)
        .single();

      if (empError || !employee) {
        toast.error('Employee not found or access denied');
        return;
      }

      // Get document type ID
      const { data: docType } = await supabase
        .from('employee_document_type')
        .select('id')
        .eq('id', document.documentTypeId)
        .single();

      // Get pending status ID
      const { data: pendingStatus } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', 'pending')
        .single();

      const { data, error } = await supabase
        .from('employee_documents')
        .insert([{
          employee_id: document.employeeId,
          document_type_id: document.documentTypeId,
          document_status_id: pendingStatus?.id,
          document_url: document.documentImage,
          document_number: document.documentNumber,
          verification_status: document.verificationStatus,
          params: document.expiryDate ? { expiryDate: document.expiryDate } : {}
        }])
        .select()
        .single();

      if (error) throw error;

      const newDocument: VerificationDocument = {
        id: data.id,
        employeeId: data.employee_id,
        documentTypeId: data.document_type_id,
        documentImage: data.document_url,
        documentNumber: data.document_number || '',
        verificationStatus: data.verification_status as 'verified' | 'failed' | 'pending',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        expiryDate: document.expiryDate,
        verificationDate: null,
        verificationNotes: '',
        verificationMethod: 'manual'
      };

      setDocuments(prev => [...prev, newDocument]);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to upload document');
    }
  }, [clientId]);

  const verifyDocument = useCallback(async (documentId: string, status: 'verified' | 'failed', method: 'api' | 'manual', notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update({
          verification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select('employee_id')
        .single();

      if (error) throw error;

      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { 
              ...doc, 
              verificationStatus: status,
              verificationDate: new Date().toISOString(),
              verificationNotes: notes || '',
              verificationMethod: method
            }
          : doc
      ));

      // Check if all documents are verified for this employee
      const employeeId = data.employee_id;
      const employeeDocs = documents.filter(d => d.employeeId === employeeId);
      const allVerified = employeeDocs.every(d => d.id === documentId ? status === 'verified' : d.verificationStatus === 'verified');

      if (allVerified && status === 'verified') {
        await updateEmployeeStatus(employeeId, true);
      }

      toast.success(`Document ${status} successfully`);
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify document');
    }
  }, [documents, updateEmployeeStatus]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  }, []);

  const getEmployeeDocuments = useCallback((employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  }, [documents]);

  return {
    documents,
    isLoading,
    fetchEmployeeDocuments,
    addDocument,
    verifyDocument,
    deleteDocument,
    getEmployeeDocuments
  };
};
