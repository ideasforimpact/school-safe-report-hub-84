
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VerificationDocument } from '@/types/employeeVerification';
import { initialDocuments } from '../initialData';
import { supabase } from '@/integrations/supabase/client';

export const useDocumentManagement = (updateEmployeeStatus: (employeeId: string, status: 'pending' | 'verified' | 'failed') => void) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>(initialDocuments);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch documents from the database via the edge function
  const fetchEmployeeDocuments = useCallback(async (employeeId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'GET',
        query: { employeeId }
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
      
      return mappedDocuments;
    } catch (err) {
      console.error('Failed to fetch employee documents:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const verifyDocument = (id: string, status: 'verified' | 'failed', notes?: string) => {
    const now = new Date().toISOString();
    
    setDocuments(documents.map(doc => {
      if (doc.id === id) {
        // Generate mock details for government-verified documents
        let details = undefined;
        if (status === 'verified') {
          switch (doc.documentType) {
            case 'aadhar':
              details = {
                address: '123 Main St, Apartment 4B, Bangalore, Karnataka 560001',
                name: doc.documentNumber ? `Holder of ${doc.documentNumber}` : 'Document Holder',
                dob: '1985-05-15'
              };
              break;
            case 'driving_license':
              details = {
                address: '45 Park Avenue, Chennai, Tamil Nadu 600001',
                name: doc.documentNumber ? `Holder of ${doc.documentNumber}` : 'Document Holder',
                issue_date: '2018-03-10',
                expiry_date: '2028-03-09'
              };
              break;
            case 'passport':
              details = {
                address: '78 Diplomatic Enclave, New Delhi, Delhi 110001',
                name: doc.documentNumber ? `Holder of ${doc.documentNumber}` : 'Document Holder',
                issue_date: '2019-07-22',
                expiry_date: '2029-07-21'
              };
              break;
            case 'voter_id':
              details = {
                address: '56 Democracy Street, Mumbai, Maharashtra 400001',
                name: doc.documentNumber ? `Holder of ${doc.documentNumber}` : 'Document Holder',
                constituency: 'Mumbai South'
              };
              break;
            case 'pan':
              details = {
                name: doc.documentNumber ? `Holder of ${doc.documentNumber}` : 'Document Holder',
                dob: '1982-11-30',
                father_name: 'Parent Name'
              };
              break;
            default:
              details = {};
          }
        }

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
    const updatedDoc = documents.find(doc => doc.id === id);
    if (updatedDoc) {
      const employeeId = updatedDoc.employeeId;
      const employeeDocs = documents.filter(doc => doc.employeeId === employeeId);
      
      // Check if all docs are verified or if any doc failed
      const allVerified = employeeDocs.every(doc => doc.verificationStatus === 'verified');
      const anyFailed = employeeDocs.some(doc => doc.verificationStatus === 'failed');
      
      if (anyFailed) {
        updateEmployeeStatus(employeeId, 'failed');
      } else if (allVerified) {
        updateEmployeeStatus(employeeId, 'verified');
      } else {
        updateEmployeeStatus(employeeId, 'pending');
      }
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

  const getEmployeeDocuments = useCallback((employeeId: string) => {
    // If we have documents for this employee in state, return them
    const localDocs = documents.filter(doc => doc.employeeId === employeeId);
    
    // If we don't have documents yet, trigger a fetch but return what we have so far
    if (localDocs.length === 0) {
      fetchEmployeeDocuments(employeeId);
    }
    
    return localDocs;
  }, [documents, fetchEmployeeDocuments]);

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
