
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VerificationDocument } from '@/types/employeeVerification';
import { initialDocuments } from '../initialData';

export const useDocumentManagement = (updateEmployeeStatus: (employeeId: string, status: 'pending' | 'verified' | 'failed') => void) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>(initialDocuments);

  const addDocument = (documentData: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDocument: VerificationDocument = {
      ...documentData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    setDocuments([...documents, newDocument]);
  };

  const verifyDocument = (id: string, status: 'verified' | 'failed', notes?: string, method: 'api' | 'manual' = 'manual') => {
    const now = new Date().toISOString();
    
    setDocuments(documents.map(doc => {
      if (doc.id === id) {
        // Generate mock details for government-verified documents
        let details = undefined;
        if (status === 'verified' && method === 'api') {
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
          verificationMethod: status === 'verified' ? method : undefined,
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

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const getEmployeeDocuments = (employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  };

  return {
    documents,
    addDocument,
    verifyDocument,
    deleteDocument,
    getEmployeeDocuments
  };
};
