
import { Employee, DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  // Original verification context values
  verifyEmployee: (employeeId: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;
  
  // Employee management
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: () => Promise<void>;
  
  // Document management
  documents: VerificationDocument[];
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchEmployeeDocuments: (employeeId: string, timeframe?: string) => Promise<void>;
  
  // Document types and statuses
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  fetchDocumentTypes: () => Promise<void>;
  fetchDocumentStatuses: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
}

// Re-export types to avoid import confusion
export type { Employee, DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';
