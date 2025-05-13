
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VerificationDocument } from '@/types/employeeVerification';
import { initialDocuments } from '../initialData';
import { supabase } from '@/integrations/supabase/client';

export const useDocumentManagement = (updateEmployeeStatus: (employeeId: string, status: 'pending' | 'verified' | 'failed') => void) => {
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
        method: 'POST',  // Change to POST since we're sending data
        body: { employeeId }
      });
      
      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
      
      // Map the documents from the database to our VerificationDocument type
      const mappedDocuments = (data?.documents || []).map((doc: any): VerificationDocument => ({
        id: doc.id,
        employeeId: employeeId,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber || '',
        documentImage: doc.documentImage,
        verificationStatus: doc.verificationStatus || 'pending',
        verificationDate: doc.verificationDate,
        verificationNotes: doc.verificationNotes,
        verificationMethod: doc.verificationMethod,
        details: doc.details,
        createdAt: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString()
      }));
      
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
      setIsLoading(true);
      
      // Call the edge function to upload the document
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: { employeeId: documentData.employeeId, documentData }
      });
      
      if (error) {
        console.error('Error adding document:', error);
        throw new Error('Failed to add document');
      }
      
      // If upload successful, add to local state
      const newDocument: VerificationDocument = {
        ...documentData,
        id: data.document.id,
        createdAt: data.document.uploadedAt,
        updatedAt: data.document.uploadedAt
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
      const now = new Date().toISOString();
      
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
      
      // Generate mock details for government-verified documents
      let details = undefined;
      if (status === 'verified') {
        switch (documentToVerify.documentType) {
          case 'aadhar':
            details = {
              address: '123 Main St, Apartment 4B, Bangalore, Karnataka 560001',
              name: documentToVerify.documentNumber ? `Holder of ${documentToVerify.documentNumber}` : 'Document Holder',
              dob: '1985-05-15'
            };
            break;
          case 'driving_license':
            details = {
              address: '45 Park Avenue, Chennai, Tamil Nadu 600001',
              name: documentToVerify.documentNumber ? `Holder of ${documentToVerify.documentNumber}` : 'Document Holder',
              issue_date: '2018-03-10',
              expiry_date: '2028-03-09'
            };
            break;
          case 'passport':
            details = {
              address: '78 Diplomatic Enclave, New Delhi, Delhi 110001',
              name: documentToVerify.documentNumber ? `Holder of ${documentToVerify.documentNumber}` : 'Document Holder',
              issue_date: '2019-07-22',
              expiry_date: '2029-07-21'
            };
            break;
          case 'voter_id':
            details = {
              address: '56 Democracy Street, Mumbai, Maharashtra 400001',
              name: documentToVerify.documentNumber ? `Holder of ${documentToVerify.documentNumber}` : 'Document Holder',
              constituency: 'Mumbai South'
            };
            break;
          case 'pan':
            details = {
              name: documentToVerify.documentNumber ? `Holder of ${documentToVerify.documentNumber}` : 'Document Holder',
              dob: '1982-11-30',
              father_name: 'Parent Name'
            };
            break;
          default:
            details = {};
        }
      }
      
      // Update local state
      setDocuments(docs => docs.map(doc => {
        if (doc.id === id) {
          return { 
            ...doc, 
            verificationStatus: status, 
            verificationDate: now,
            verificationNotes: notes || doc.verificationNotes,
            verificationMethod: status === 'verified' ? 'api' : undefined,
            details: details,
            updatedAt: now
          };
        }
        return doc;
      }));

      // Update employee status if all documents are verified or if any document fails
      const employeeDocs = documents.filter(doc => doc.employeeId === employeeId);
      
      // Check if all docs are verified or if any doc failed
      const allVerified = employeeDocs.every(doc => {
        if (doc.id === id) return status === 'verified';
        return doc.verificationStatus === 'verified';
      });
      
      const anyFailed = employeeDocs.some(doc => {
        if (doc.id === id) return status === 'failed';
        return doc.verificationStatus === 'failed';
      });
      
      if (anyFailed) {
        updateEmployeeStatus(employeeId, 'failed');
      } else if (allVerified) {
        updateEmployeeStatus(employeeId, 'verified');
      } else {
        updateEmployeeStatus(employeeId, 'pending');
      }
      
    } catch (err) {
      console.error('Error in verifyDocument:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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
