
import { Employee, Document } from './hooks';

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: Document[];
  addEmployee: (employee: Omit<Employee, 'id'>) => any;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addDocument: (document: Omit<Document, 'id'>) => any;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  getEmployeeDocuments: (employeeId: string) => Document[];
}

export type { Employee, Document };
