
import { ReactNode } from 'react';
import { Employee, DocumentType, VerificationDocument, DocumentStatus } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: VerificationDocument[];
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addDocument: (documentData: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: () => Promise<Employee[]>;
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  fetchDocumentTypes: () => Promise<DocumentType[]>;
  fetchDocumentStatuses: () => Promise<DocumentStatus[]>;
  isLoading: boolean;
}

export interface EmployeeVerificationProviderProps {
  children: ReactNode;
}
