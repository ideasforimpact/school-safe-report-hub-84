
export interface EmployeeDocument {
  id: string;
  documentType: string;
  documentNumber?: string;
  documentUrl: string;
  verificationStatus: string;
  employeeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  joiningDate: string;
  department: string;
  position: string;
  employeeType: 'permanent' | 'contract' | 'temporary';
  status: 'pending' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
  clientId?: string;
}

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
  isLoading: boolean;
  employees: Employee[];
  documents: VerificationDocument[];
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  
  // Employee functions
  fetchEmployees: () => Promise<Employee[]>;
  getEmployee: (id: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Document functions
  fetchEmployeeDocuments: (employeeId: string) => Promise<VerificationDocument[]>;
  fetchDocumentTypes: () => Promise<DocumentType[]>;
  fetchDocumentStatuses: () => Promise<DocumentStatus[]>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (documentId: string, status: string, notes?: string) => Promise<{ success: boolean; error?: any }>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export interface VerificationDocument {
  id: string;
  employeeId: string;
  documentTypeId: string;
  documentTypeName?: string;
  documentNumber?: string;
  documentImage: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  documentStatusId?: string;
  documentStatusName?: string;
  verificationDate?: string;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
  employee_docs_log?: Array<{
    timestamp: string;
    action: string;
    response: any;
  }>;
  details?: {
    address?: string;
    name?: string;
    dob?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}
