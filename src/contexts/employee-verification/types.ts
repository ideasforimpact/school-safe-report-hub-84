
import { ReactNode } from 'react';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: VerificationDocument[];
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  verifyDocument: (documentId: string, status: 'verified' | 'failed', notes?: string) => void;
  deleteDocument: (documentId: string) => void;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: () => Promise<void>;
}

export interface EmployeeVerificationProviderProps {
  children: ReactNode;
}
