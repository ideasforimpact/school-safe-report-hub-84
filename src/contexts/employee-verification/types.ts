import { Employee as EmployeeBase, VerificationDocument } from '@/types/employeeVerification';

// Extended Employee type with proper status fields
export interface Employee extends EmployeeBase {
  // Keep existing fields from EmployeeBase
}

// Alias VerificationDocument as Document for context use
export type Document = VerificationDocument;

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStatus {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeVerificationContextType {
  employees: Employee[];
  documents: Document[];
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  isLoading?: boolean;
  
  // Employee methods
  addEmployee: (employee: Omit<Employee, 'id'>) => any;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  
  // Document methods
  addDocument: (document: Omit<Document, 'id'>) => any;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  getEmployeeDocuments: (employeeId: string) => Document[];
  fetchEmployeeDocuments: (employeeId: string) => Promise<void> | void;
  fetchDocumentStatuses: () => Promise<void> | void;
}
