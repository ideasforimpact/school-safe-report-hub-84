import { Employee, DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  // Original verification context values
  verifyEmployee: (employeeId: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;
  
  // Employee management
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<boolean>;
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: () => Promise<Employee[]>;
  
  // Document management
  documents: VerificationDocument[];
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchEmployeeDocuments: (employeeId: string, timeframe?: string) => Promise<VerificationDocument[]>;
  
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
