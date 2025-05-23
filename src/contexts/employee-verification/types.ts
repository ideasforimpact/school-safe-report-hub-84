
import { Employee, VerificationDocument, DocumentType, DocumentStatus } from '@/types/employeeVerification';

// Type definition for the employee verification context
export interface EmployeeVerificationContextType {
  // Employee verification
  verifyEmployee: (employeeId: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;
  
  // Employee management
  employees: Employee[];
  addEmployee: (employee: Partial<Employee>) => Promise<Employee | null>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: (clientId?: string | null) => Promise<Employee[]>;
  
  // Document management
  documents: VerificationDocument[];
  addDocument: (document: Partial<VerificationDocument>, file: File) => Promise<VerificationDocument | null>;
  verifyDocument: (documentId: string, status: 'verified' | 'failed', notes: string) => Promise<boolean>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  
  // Document types and statuses
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  fetchDocumentTypes: () => Promise<void>;
  fetchDocumentStatuses: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
}

export type { Employee, VerificationDocument, DocumentType, DocumentStatus };

// Re-export the initial data
export { initialDocumentTypes, initialDocumentStatuses } from './initialData';
