
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

// Sample initial data
const initialEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876543210',
    dateOfBirth: '1990-05-15',
    address: '123 Main Street, Mumbai, Maharashtra',
    joiningDate: '2023-01-10',
    department: 'Engineering',
    position: 'Software Developer',
    status: 'verified',
    createdAt: '2023-01-05T10:30:00Z',
    updatedAt: '2023-01-15T14:20:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '8765432109',
    dateOfBirth: '1992-08-22',
    address: '456 Park Avenue, Delhi, Delhi',
    joiningDate: '2023-02-15',
    department: 'Marketing',
    position: 'Marketing Specialist',
    status: 'pending',
    createdAt: '2023-02-10T09:15:00Z',
    updatedAt: '2023-02-10T09:15:00Z'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    name: 'Amit Kumar',
    email: 'amit.kumar@example.com',
    phone: '7654321098',
    dateOfBirth: '1988-11-30',
    address: '789 Oak Lane, Bangalore, Karnataka',
    joiningDate: '2023-03-05',
    department: 'Finance',
    position: 'Financial Analyst',
    status: 'failed',
    createdAt: '2023-03-01T11:45:00Z',
    updatedAt: '2023-03-10T16:30:00Z'
  }
];

const initialDocuments: VerificationDocument[] = [
  {
    id: '1',
    employeeId: '1',
    documentType: 'aadhar',
    documentNumber: '1234 5678 9012',
    documentImage: '/placeholder.svg',
    verificationStatus: 'verified',
    verificationDate: '2023-01-15T14:20:00Z',
    verificationNotes: 'Document verified successfully',
    verificationMethod: 'api',
    createdAt: '2023-01-10T10:30:00Z',
    updatedAt: '2023-01-15T14:20:00Z'
  },
  {
    id: '2',
    employeeId: '1',
    documentType: 'pan',
    documentNumber: 'ABCDE1234F',
    documentImage: '/placeholder.svg',
    verificationStatus: 'verified',
    verificationDate: '2023-01-16T11:30:00Z',
    verificationNotes: 'PAN card details match with records',
    verificationMethod: 'manual',
    createdAt: '2023-01-11T09:45:00Z',
    updatedAt: '2023-01-16T11:30:00Z'
  },
  {
    id: '3',
    employeeId: '2',
    documentType: 'aadhar',
    documentNumber: '9876 5432 1098',
    documentImage: '/placeholder.svg',
    verificationStatus: 'pending',
    createdAt: '2023-02-12T13:20:00Z',
    updatedAt: '2023-02-12T13:20:00Z'
  },
  {
    id: '4',
    employeeId: '3',
    documentType: 'driving_license',
    documentNumber: 'DL987654321098',
    documentImage: '/placeholder.svg',
    verificationStatus: 'failed',
    verificationDate: '2023-03-10T16:30:00Z',
    verificationNotes: 'License expired. Needs renewal.',
    createdAt: '2023-03-07T10:15:00Z',
    updatedAt: '2023-03-10T16:30:00Z'
  }
];

interface EmployeeVerificationContextType {
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

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (!context) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};

interface EmployeeVerificationProviderProps {
  children: ReactNode;
}

export const EmployeeVerificationProvider: React.FC<EmployeeVerificationProviderProps> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [documents, setDocuments] = useState<VerificationDocument[]>(initialDocuments);

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...employeeData,
      id: uuidv4(),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    setEmployees([...employees, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp
    ));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    // Also delete related documents
    setDocuments(documents.filter(doc => doc.employeeId !== id));
  };

  const addDocument = (documentData: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDocument: VerificationDocument = {
      ...documentData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    setDocuments([...documents, newDocument]);
  };

  const verifyDocument = (id: string, status: 'verified' | 'failed', notes?: string, method: 'api' | 'manual' = 'manual') => {
    const now = new Date().toISOString();
    setDocuments(documents.map(doc => 
      doc.id === id ? { 
        ...doc, 
        verificationStatus: status, 
        verificationDate: now,
        verificationNotes: notes || doc.verificationNotes,
        verificationMethod: status === 'verified' ? method : undefined,
        updatedAt: now
      } : doc
    ));

    // Update employee status if all documents are verified or if any document fails
    const updatedDoc = documents.find(doc => doc.id === id);
    if (updatedDoc) {
      const employeeId = updatedDoc.employeeId;
      const employeeDocs = documents.filter(doc => doc.employeeId === employeeId);
      
      // Check if all docs are verified or if any doc failed
      const allVerified = employeeDocs.every(doc => doc.verificationStatus === 'verified');
      const anyFailed = employeeDocs.some(doc => doc.verificationStatus === 'failed');
      
      if (anyFailed) {
        updateEmployee(employeeId, { status: 'failed' });
      } else if (allVerified) {
        updateEmployee(employeeId, { status: 'verified' });
      } else {
        updateEmployee(employeeId, { status: 'pending' });
      }
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const getEmployeeDocuments = (employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  return (
    <EmployeeVerificationContext.Provider
      value={{
        employees,
        documents,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addDocument,
        verifyDocument,
        deleteDocument,
        getEmployeeDocuments,
        getEmployee
      }}
    >
      {children}
    </EmployeeVerificationContext.Provider>
  );
};
