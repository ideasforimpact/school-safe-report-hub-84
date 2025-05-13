
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
    setDocuments(documents.map(doc => 
      doc.id === id ? { 
        ...doc, 
        verificationStatus: status, 
        verificationDate: now,
        verificationNotes: notes || doc.verificationNotes,
        verificationMethod: status === 'verified' ? method : undefined,
        updatedAt: now
      } : doc
    ));

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
