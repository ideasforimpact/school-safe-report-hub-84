
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: VerificationDocument[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  verifyDocument: (id: string, status: 'verified' | 'failed', notes?: string, method?: 'api' | 'manual') => void;
  deleteDocument: (id: string) => void;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  getEmployee: (id: string) => Employee | undefined;
}

export interface EmployeeVerificationProviderProps {
  children: React.ReactNode;
}
