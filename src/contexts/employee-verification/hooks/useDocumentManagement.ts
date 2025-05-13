import { useState, useCallback, useEffect } from 'react';
import { VerificationDocument } from '@/types/employeeVerification';
import { initialDocuments } from '../initialData';
import { supabase } from '@/integrations/supabase/client';

export const useDocumentManagement = (updateEmployeeStatus: (employeeId: string, status: 'pending' | 'verified' | 'failed') => Promise<void>) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>(initialDocuments);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedEmployeeIds, setFetchedEmployeeIds] = useState<string[]>([]);

  // Fetch documents from the database via the edge function
  const fetchEmployeeDocuments = useCallback(async (employeeId: string) => {
    // Skip if we're already loading or if this employee's documents have already been fetched
    if (isLoading || fetchedEmployeeIds.includes(employeeId)) {
      return [];
    }
    
    setIsLoading(true);
    try {
      // For GET requests, we should pass parameters as query strings, not in the body
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',  // Using POST to send data in body
        body: { employeeId }
      });
      
      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
      
      // Documents are now returned directly from the edge function
      const mappedDocuments = data?.documents || [];
      
      setDocuments(currentDocuments => {
        // Merge with existing documents that are not for this employee
        const otherEmployeeDocs = currentDocuments.filter(doc => doc.employeeId !== employeeId);
        return [...otherEmployeeDocs, ...mappedDocuments];
      });
      
      // Mark this employee ID as fetched
      if (!fetchedEmployeeIds.includes(employeeId)) {
        setFetchedEmployeeIds(prev => [...prev, employeeId]);
      }
      
      return mappedDocuments;
    } catch (err) {
      console.error('Failed to fetch employee documents:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, fetchedEmployeeIds]);

  const addDocument = async (documentData: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Starting document upload process:', {
        employeeId: documentData.employeeId,
        documentTypeId: documentData.documentTypeId,
        hasImage: !!documentData.documentImage,
        hasDocNumber: !!documentData.documentNumber
      });
      
      setIsLoading(true);
      
      // Call the edge function to upload the document with only necessary data
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: { 
          employeeId: documentData.employeeId, 
          documentData: {
            documentTypeId: documentData.documentTypeId,
            documentNumber: documentData.documentNumber,
            documentImage: documentData.documentImage
          } 
        }
      });
      
      if (error) {
        console.error('Error adding document:', error);
        throw new Error('Failed to add document');
      }
      
      console.log('Document upload successful, response:', data);
      
      // Add the returned document to local state
      const newDocument: VerificationDocument = {
        id: data.document.id,
        employeeId: documentData.employeeId,
        documentTypeId: documentData.documentTypeId,
        documentTypeName: data.document.documentTypeName,
        documentNumber: data.document.documentNumber || '',
        documentImage: data.document.documentImage || '',
        verificationStatus: data.document.verificationStatus || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err) {
      console.error('Error in addDocument:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDocument = async (id: string, status: 'verified' | 'failed', notes?: string) => {
    try {
      setIsLoading(true);
      const documentToVerify = documents.find(doc => doc.id === id);
      
      if (!documentToVerify) {
        throw new Error('Document not found');
      }
      
      // Find the document first to get employeeId
      const employeeId = documentToVerify.employeeId;
      
      // Call the edge function to update the document verification status
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'PUT',
        body: { 
          employeeId,
          documentId: id,
          verificationStatus: status,
          verificationNotes: notes
        }
      });
      
      if (error) {
        console.error('Error updating document verification status:', error);
        throw new Error('Failed to update document verification status');
      }
      
      // Update local state with the updated document
      setDocuments(docs => docs.map(doc => {
        if (doc.id === id) {
          return { 
            ...doc, 
            verificationStatus: status, 
            verificationDate: new Date().toISOString(),
            verificationNotes: notes || doc.verificationNotes,
            verificationMethod: status === 'verified' ? 'api' : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return doc;
      }));

      // Update employee status based on all documents
      await updateEmployeeStatus(employeeId, data.status || status);
      
    } catch (err) {
      console.error('Error in verifyDocument:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete document with updated schema support
  const deleteDocument = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Find the document first to get employeeId
      const docToDelete = documents.find(doc => doc.id === id);
      
      if (!docToDelete) {
        throw new Error('Document not found');
      }
      
      // Call the edge function to delete the document
      const { error } = await supabase.functions.invoke('employee-documents', {
        method: 'DELETE',
        body: { 
          employeeId: docToDelete.employeeId,
          documentId: id
        }
      });
      
      if (error) {
        console.error('Error deleting document:', error);
        throw new Error('Failed to delete document');
      }
      
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('Error in deleteDocument:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Modified to avoid state updates during render
  const getEmployeeDocuments = useCallback((employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  }, [documents]);

  // Add a new effect to check and fetch documents if needed
  useEffect(() => {
    const checkAndFetchEmployeeDocuments = async (employeeId: string) => {
      // If we haven't fetched documents for this employee yet and we're not loading
      if (!fetchedEmployeeIds.includes(employeeId) && !isLoading) {
        const docsForEmployee = documents.filter(doc => doc.employeeId === employeeId);
        
        // Only fetch if we don't have docs for this employee
        if (docsForEmployee.length === 0) {
          await fetchEmployeeDocuments(employeeId);
        }
      }
    };
    
    // This effect will run when component using getEmployeeDocuments mounts
    return () => {}; // Empty cleanup function
  }, [fetchedEmployeeIds, documents, isLoading, fetchEmployeeDocuments]);

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
