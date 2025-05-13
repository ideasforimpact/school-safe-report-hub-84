
import { Employee, VerificationDocument, DocumentType, DocumentStatus } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: VerificationDocument[];
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  
  // Employee management functions
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: () => Promise<Employee[]>;
  
  // Document management functions
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (documentId: string, status: 'verified' | 'failed', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  
  // Metadata functions
  fetchDocumentTypes: () => Promise<DocumentType[]>;
  fetchDocumentStatuses: () => Promise<DocumentStatus[]>;
  
  // States
  isLoading: boolean;
}

export interface EmployeeVerificationProviderProps {
  children: React.ReactNode;
}
