
import { Employee, DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: VerificationDocument[];
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | Employee>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | VerificationDocument>;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes: string, documentStatusId?: string) => Promise<void>;
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
  children: React.ReactNode;
}
