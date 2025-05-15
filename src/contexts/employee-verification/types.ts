
import { Employee, VerificationDocument, DocumentType, DocumentStatus } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  // Original properties
  verifyEmployee: (employeeId: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;
  
  // Employee management
  employees: Employee[];
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: () => Promise<Employee[]>;
  
  // Document management
  documents: VerificationDocument[];
  addDocument: (documentData: any) => Promise<VerificationDocument>;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  
  // Document types and statuses
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  fetchDocumentTypes: () => Promise<DocumentType[]>;
  fetchDocumentStatuses: () => Promise<DocumentStatus[]>;
  
  // Loading state
  isLoading: boolean;
}
