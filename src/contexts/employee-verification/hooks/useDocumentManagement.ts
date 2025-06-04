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

  // Helper function to upload base64 file to Supabase storage
  const uploadDocumentToStorage = async (base64Data: string, employeeId: string, documentType: string): Promise<string> => {
    try {
      console.log('Starting upload to storage for employee:', employeeId);
      
      // Extract the base64 content and content type
      const base64Regex = /^data:([^;]+);base64,(.+)$/;
      const matches = base64Data.match(base64Regex);
      
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 image format");
      }
      
      const contentType = matches[1];
      const base64Content = matches[2];
      const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
      
      // Generate a unique file path
      const timestamp = new Date().getTime();
      const fileExtension = contentType.includes('pdf') ? 'pdf' : 'jpg';
      const filePath = `${employeeId}/${documentType}_${timestamp}.${fileExtension}`;
      
      console.log('Uploading file to storage at path:', filePath);
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('employee-documents')
        .upload(filePath, binaryData, {
          contentType,
          upsert: true
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      console.log('File uploaded successfully to storage:', uploadData);
      
      // Return the file path for database storage
      return filePath;
    } catch (error) {
      console.error('Error uploading document to storage:', error);
      throw error;
    }
  };

  const fetchEmployeeDocuments = useCallback(async (employeeId: string): Promise<VerificationDocument[]> => {
    if (!clientId) {
      console.log('No client ID available - cannot fetch documents');
      return [];
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
        return [];
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
          cron_activate,
          cron_activated_date,
          cron_updated_date,
          created_at,
          updated_at,
          document_type:employee_document_type(name, description),
          document_status:document_status(name, description)
        `)
        .eq('employee_id', employeeId);

      if (error) {
        console.error('Error fetching employee documents:', error);
        return [];
      }

      const formattedDocuments: VerificationDocument[] = data.map(doc => {
        let documentUrl = doc.document_url;
        
        // If document_url is a storage path, convert to full URL
        if (documentUrl && !documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
          documentUrl = `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${documentUrl}`;
        }
        
        return {
          id: doc.id,
          employeeId: doc.employee_id,
          documentTypeId: doc.document_type_id || '',
          documentTypeName: doc.document_type?.name || 'Unknown',
          documentNumber: doc.document_number || '',
          documentImage: documentUrl,
          verificationStatus: (doc.verification_status as 'verified' | 'failed' | 'pending') || 'pending',
          documentStatusId: doc.document_status_id,
          documentStatusName: doc.document_status?.name,
          verificationDate: null,
          verificationNotes: '',
          verificationMethod: 'manual',
          // Map new cron fields
          cronActivate: doc.cron_activate || false,
          cronActivatedDate: doc.cron_activated_date || undefined,
          cronUpdatedDate: doc.cron_updated_date || undefined,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        };
      });

      console.log('Fetched documents:', formattedDocuments);
      setDocuments(prev => {
        const filtered = prev.filter(d => d.employeeId !== employeeId);
        return [...filtered, ...formattedDocuments];
      });
      
      return formattedDocuments;
    } catch (error) {
      console.error('Error in fetchEmployeeDocuments:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const addDocument = useCallback(async (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientId) {
      toast.error('No client context available');
      return;
    }

    if (!document.documentImage) {
      toast.error('Document image is required');
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

      let documentUrlForDB = document.documentImage;

      // If it's a base64 document, upload to storage first
      if (document.documentImage.startsWith('data:')) {
        console.log('Uploading base64 document to storage...');
        const storagePath = await uploadDocumentToStorage(
          document.documentImage, 
          document.employeeId, 
          document.documentTypeName || 'document'
        );
        documentUrlForDB = storagePath; // Store path in database
        console.log('Document uploaded to storage, path:', storagePath);
      }

      // Get document type ID if not provided
      let documentTypeId = document.documentTypeId;
      if (!documentTypeId) {
        const { data: docType } = await supabase
          .from('employee_document_type')
          .select('id')
          .eq('name', document.documentTypeName)
          .single();
        documentTypeId = docType?.id;
      }

      // Get pending status ID if not provided
      let documentStatusId = document.documentStatusId;
      if (!documentStatusId) {
        const { data: pendingStatus } = await supabase
          .from('document_status')
          .select('id')
          .eq('name', 'pending')
          .single();
        documentStatusId = pendingStatus?.id;
      }

      console.log('Inserting document with data:', {
        employee_id: document.employeeId,
        document_type_id: documentTypeId,
        document_status_id: documentStatusId,
        document_url: documentUrlForDB,
        document_number: document.documentNumber || null,
        verification_status: document.verificationStatus,
        params: document.params || {},
        cron_activate: document.cronActivate || false,
        cron_activated_date: document.cronActivatedDate || null,
        cron_updated_date: document.cronUpdatedDate || null
      });

      const { data, error } = await supabase
        .from('employee_documents')
        .insert([{
          employee_id: document.employeeId,
          document_type_id: documentTypeId,
          document_status_id: documentStatusId,
          document_url: documentUrlForDB,
          document_number: document.documentNumber || null,
          verification_status: document.verificationStatus,
          params: document.params || {},
          cron_activate: document.cronActivate || false,
          cron_activated_date: document.cronActivatedDate || null,
          cron_updated_date: document.cronUpdatedDate || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Create the document object with proper URL for frontend display
      let displayUrl = data.document_url;
      if (!displayUrl.startsWith('data:') && !displayUrl.startsWith('https://')) {
        displayUrl = `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${displayUrl}`;
      }

      const newDocument: VerificationDocument = {
        id: data.id,
        employeeId: data.employee_id,
        documentTypeId: documentTypeId || '',
        documentTypeName: document.documentTypeName || '',
        documentNumber: data.document_number || '',
        documentImage: displayUrl,
        verificationStatus: data.verification_status as 'verified' | 'failed' | 'pending',
        documentStatusId: documentStatusId,
        documentStatusName: 'pending',
        verificationDate: null,
        verificationNotes: '',
        verificationMethod: 'manual',
        params: document.params,
        cronActivate: data.cron_activate || false,
        cronActivatedDate: data.cron_activated_date || undefined,
        cronUpdatedDate: data.cron_updated_date || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setDocuments(prev => [...prev, newDocument]);
      toast.success('Document uploaded successfully to storage');
      
      return newDocument;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to upload document: ' + (error?.message || 'Unknown error'));
      throw error;
    }
  }, [clientId]);

  const verifyDocument = useCallback(async (documentId: string, status: 'verified' | 'failed', method: 'api' | 'manual' = 'manual', notes?: string) => {
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
