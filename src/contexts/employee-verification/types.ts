
import { ReactNode } from 'react';
import { Employee, VerificationDocument, DocumentType, DocumentStatus } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: VerificationDocument[];
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, update: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (id: string, notes?: string) => Promise<VerificationDocument>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  getEmployee: (id: string) => Employee | undefined;
  getDocument: (id: string) => VerificationDocument;
  fetchEmployees: () => Promise<Employee[]>;
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  fetchDocumentTypes: () => Promise<DocumentType[]>;
  fetchDocumentStatuses: () => Promise<DocumentStatus[]>;
  isLoading: boolean;
}

export interface EmployeeVerificationProviderProps {
  children: ReactNode;
}
