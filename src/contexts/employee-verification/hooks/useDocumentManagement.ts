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
          verified_by,
          params,
          documents_files,
          comments,
          employee_docs_log,
          last_otp_generated,
          cron_activate,
          cron_activated_date,
          cron_updated_date,
          cron_log,
          created_at,
          updated_at,
          document_type:employee_document_type(name, description),
          document_status:document_status(name, description)
        `)
        .eq('employee_id', employeeId)
        .eq('is_delete', 0);

      if (error) {
        console.error('Error fetching employee documents:', error);
        return [];
      }

      const formattedDocuments: VerificationDocument[] = data.map(doc => {
        console.log('Processing document:', {
          id: doc.id,
          documentTypeName: doc.document_type?.name,
          verificationStatus: doc.verification_status,
          documentStatusName: doc.document_status?.name,
          employeeId: doc.employee_id,
          // Try to access reject_reason to see if it exists
          rejectReasonExists: 'reject_reason' in doc,
          rejectReasonValue: (doc as any).reject_reason
        });

        let documentUrl = doc.document_url;
        
        // If document_url is a storage path, convert to full URL
        if (documentUrl && !documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
          const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL || 'https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public';
          const normalizedBase = base.replace(/\/$/, '');
          documentUrl = `${normalizedBase}/employee-documents/${documentUrl}`;
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
          verifiedByEmployeeId: doc.verified_by || undefined,
          verificationDate: null,
          verificationNotes: '',
          verificationMethod: 'manual',
          rejectReason: (doc as any).reject_reason || undefined,
          // Map new cron fields including cron_log with proper type casting
          cronActivate: doc.cron_activate || false,
          cronActivatedDate: doc.cron_activated_date || undefined,
          cronUpdatedDate: doc.cron_updated_date || undefined,
          cronLog: Array.isArray(doc.cron_log) ? (doc.cron_log as Array<{
            timestamp: string;
            action: string;
            status: string;
            details?: any;
            error?: string;
          }>) : [],
          documents_files: Array.isArray((doc as any).documents_files) ? (doc as any).documents_files : [],
          comments: Array.isArray((doc as any).comments) ? (doc as any).comments : [],
          params: typeof doc.params === 'object' && doc.params !== null ? doc.params as { [key: string]: any; DOB?: string; } : {},
          employee_docs_log: Array.isArray(doc.employee_docs_log) ? doc.employee_docs_log as Array<{
            timestamp: string;
            action: string;
            response: any;
            notes?: string;
          }> : [],
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
      // Use unified edge function for fast single-file upload
      if (document.documentImage.startsWith('data:')) {
        console.log('Using unified edge function for document upload...');
        
        // Extract file info from base64
        const base64Data = document.documentImage;
        const mimeType = base64Data.split(':')[1].split(';')[0];
        const fileExtension = mimeType.includes('pdf') ? 'pdf' : 'jpg';
        const fileName = `document-${Date.now()}.${fileExtension}`;

        const { data, error } = await supabase.functions.invoke('unified-document-upload', {
          body: {
            employeeId: document.employeeId,
            clientId: clientId,
            documentTypeId: document.documentTypeId,
            documentNumber: document.documentNumber,
            documentFile: {
              name: fileName,
              type: mimeType,
              size: Math.round((base64Data.length * 3) / 4), // Approximate size
              base64: base64Data
            },
            params: document.params || {}
          }
        });

        if (error) {
          throw new Error(error.message || 'Upload failed');
        }

        // Convert response to VerificationDocument format
        const newDocument: VerificationDocument = {
          id: data.document.id,
          employeeId: data.document.employeeId,
          documentTypeId: data.document.documentTypeId,
          documentTypeName: data.document.documentTypeName,
          documentNumber: data.document.documentNumber || '',
          documentImage: data.document.documentImage, // Already has full URL
          verificationStatus: data.document.verificationStatus as 'verified' | 'failed' | 'pending',
          documentStatusId: data.document.documentStatusId,
          documentStatusName: data.document.documentStatusName,
          verificationDate: null,
          verificationNotes: '',
          verificationMethod: 'manual',
          params: data.document.params,
          cronActivate: false,
          cronActivatedDate: undefined,
          cronUpdatedDate: undefined,
          cronLog: [],
          createdAt: data.document.createdAt,
          updatedAt: data.document.updatedAt
        };

        setDocuments(prev => [...prev, newDocument]);
        toast.success('Document uploaded successfully');
        
        return newDocument;
      } else {
        // Fallback for non-base64 documents (shouldn't happen in normal flow)
        toast.error('Invalid document format');
        return;
      }
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to upload document: ' + (error?.message || 'Unknown error'));
      throw error;
    }
  }, [clientId, supabase]);

  const verifyDocument = useCallback(async (documentId: string, status: 'verified' | 'failed', method: 'api' | 'manual' = 'manual', notes?: string) => {
    try {
      console.log('verifyDocument called with:', { documentId, status, method, notes, employeeData });
      
      // First get the appropriate status ID from document_status table
      const statusName = status === 'verified' ? 'governance' : 'rejected';
      const { data: statusRecord, error: statusError } = await supabase
        .from('document_status')
        .select('id')
        .eq('name', statusName)
        .single();

      if (statusError || !statusRecord) {
        console.error(`Error fetching ${statusName} status:`, statusError);
        throw new Error(`Could not find ${statusName} status`);
      }

      console.log('Found status record:', statusRecord);

      // Update both verification_status and document_status_id
      const updateData = {
        verification_status: status,
        document_status_id: statusRecord.id,
        updated_at: new Date().toISOString(),
        ...(employeeData?.id && { verified_by: employeeData.id })
      };

      console.log('Updating document with data:', updateData);

      const { data, error } = await supabase
        .from('employee_documents')
        .update(updateData)
        .eq('id', documentId)
        .select('employee_id')
        .single();

      console.log('Database update result:', { data, error });

      if (error) throw error;

      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { 
              ...doc, 
              verificationStatus: status,
              documentStatusId: statusRecord.id,
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
        console.log('All documents verified for employee:', employeeId);
        await updateEmployeeStatus(employeeId, true);
      }

      toast.success(`Document ${status === 'verified' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify document');
    }
  }, [documents, updateEmployeeStatus, employeeData]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      // Soft delete: Set is_delete = 1 instead of hard deleting
      const { error } = await supabase
        .from('employee_documents')
        .update({ is_delete: 1, updated_at: new Date().toISOString() })
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
