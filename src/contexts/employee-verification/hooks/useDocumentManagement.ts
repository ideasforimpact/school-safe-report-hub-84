import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerificationDocument } from '../types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';

export const useDocumentManagement = (updateEmployeeStatus: (employeeId: string, status: boolean) => Promise<void>) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, employeeData } = useAuth();
  const { state } = useEmployeeStore();

  // Use switch-context aware Redux client IDs first, then auth fallbacks.
  const clientId =
    state.activeClientId ||
    state.clientId ||
    employeeData?.homeClientId ||
    employeeData?.clientId ||
    user?.clientId;

  // Stable ref — updated each render so fetchEmployeeDocuments (empty deps) always reads current value
  const clientIdRef = useRef<string | undefined>(undefined);
  clientIdRef.current = clientId;

  // Per-employee in-flight set — prevents concurrent duplicate fetches for the same employee
  const fetchingEmployeeDocsRef = useRef<Set<string>>(new Set());

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

  const fetchEmployeeDocuments = useCallback(async (employeeId: string, timeframe?: string): Promise<VerificationDocument[]> => {
    // Skip if the same employee is already being fetched (prevents concurrent duplicate calls)
    const fetchKey = `${employeeId}:${timeframe || ''}`;
    if (fetchingEmployeeDocsRef.current.has(fetchKey)) return [];
    fetchingEmployeeDocsRef.current.add(fetchKey);

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        body: {
          employeeId,
          clientId: clientIdRef.current || undefined,
          timeframe: timeframe && timeframe !== 'all' ? timeframe : undefined,
        },
      });

      if (error) throw new Error(error.message || 'Failed to fetch documents');

      const formattedDocuments: VerificationDocument[] = (data?.documents || []).map((doc: any) => ({
        id: doc.id,
        employeeId: doc.employeeId,
        documentTypeId: doc.documentTypeId || '',
        documentTypeName: doc.documentTypeName || 'Unknown',
        documentNumber: doc.documentNumber || '',
        documentImage: doc.documentImage,
        verificationStatus: (doc.verificationStatus as 'verified' | 'failed' | 'pending') || 'pending',
        documentStatusId: doc.documentStatusId,
        documentStatusName: doc.documentStatusName,
        verifiedByEmployeeId: doc.verifiedByEmployeeId || undefined,
        verificationDate: null,
        verificationNotes: '',
        verificationMethod: 'manual',
        rejectReason: doc.rejectReason || undefined,
        apiResponseData: doc.apiResponseData || undefined,
        apiVerificationStatus: doc.apiVerificationStatus || null,
        apiVerificationDate: doc.apiVerificationDate || undefined,
        apiVerificationMethod: doc.apiVerificationMethod || undefined,
        params: doc.params || {},
        employee_docs_log: Array.isArray(doc.employee_docs_log) ? doc.employee_docs_log : [],
        documents_files: Array.isArray(doc.documents_files) ? doc.documents_files : [],
        comments: Array.isArray(doc.comments) ? doc.comments : [],
        personalInfo: doc.personalInfo || undefined,
        lastOtpGenerated: doc.lastOtpGenerated || undefined,
        cronActivate: doc.cronActivate || false,
        cronActivatedDate: doc.cronActivatedDate || undefined,
        cronUpdatedDate: doc.cronUpdatedDate || undefined,
        cronLog: Array.isArray(doc.cronLog) ? doc.cronLog : [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

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
      fetchingEmployeeDocsRef.current.delete(fetchKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — reads latest clientId via ref

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
      // Find the employee ID for this document from local state
      const doc = documents.find(d => d.id === documentId);
      const employeeId = doc?.employeeId;

      const { data, error } = await supabase.functions.invoke('employee-documents', {
        body: {
          action: 'updateVerification',
          employeeId,
          documentId,
          verificationStatus: status,
          verificationNotes: notes || '',
        },
      });

      if (error) throw new Error(error.message || 'Failed to update verification');

      // Update local state with the returned document data
      const updated = data?.document;
      setDocuments(prev => prev.map(d =>
        d.id === documentId
          ? {
              ...d,
              verificationStatus: status,
              documentStatusId: updated?.documentStatusId || d.documentStatusId,
              documentStatusName: updated?.documentStatusName || d.documentStatusName,
              verificationDate: new Date().toISOString(),
              verificationNotes: notes || '',
              verificationMethod: method,
            }
          : d
      ));

      toast.success(`Document ${status === 'verified' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify document');
    }
  }, [documents]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      const { error } = await supabase.functions.invoke('employee-documents', {
        body: {
          action: 'deleteDocument',
          employeeId: doc?.employeeId,
          documentId,
        },
      });
      if (error) throw new Error(error.message || 'Failed to delete document');
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  }, [documents]);

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
