
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
  EmployeeVerificationContextType, 
  Employee, 
  Document, 
  DocumentType,
  DocumentStatus
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

// Mock initial data
const initialEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    dateOfBirth: '1990-01-15',
    address: '123 Main St',
    joiningDate: '2022-01-01',
    department: 'Engineering',
    position: 'Software Engineer',
    employeeType: 'permanent',
    status: 'verified',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-01-01T00:00:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '987-654-3210',
    dateOfBirth: '1992-05-20',
    address: '456 Oak Ave',
    joiningDate: '2022-02-15',
    department: 'HR',
    position: 'HR Manager',
    employeeType: 'permanent',
    status: 'pending',
    createdAt: '2022-02-15T00:00:00Z',
    updatedAt: '2022-02-15T00:00:00Z'
  }
];

const initialDocuments: Document[] = [
  {
    id: '1',
    employeeId: '1',
    documentTypeId: '1',
    documentTypeName: 'aadhar',
    documentNumber: 'AAAA1234A',
    documentImage: '/placeholder-image.jpg',
    verificationStatus: 'verified',
    documentStatusId: '1',
    documentStatusName: 'Verified',
    verificationDate: '2022-02-01T00:00:00Z',
    details: {
      name: 'John Doe',
      address: '123 Main St',
      dob: '1990-01-15'
    },
    createdAt: '2022-01-15T00:00:00Z',
    updatedAt: '2022-02-01T00:00:00Z'
  },
  {
    id: '2',
    employeeId: '1',
    documentTypeId: '2',
    documentTypeName: 'pan',
    documentNumber: 'ABCDE1234F',
    documentImage: '/placeholder-image.jpg',
    verificationStatus: 'pending',
    documentStatusId: '2',
    documentStatusName: 'Pending',
    createdAt: '2022-01-15T00:00:00Z',
    updatedAt: '2022-01-15T00:00:00Z'
  }
];

const initialDocumentTypes: DocumentType[] = [
  { id: '1', name: 'aadhar', description: 'Aadhar Card', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '2', name: 'pan', description: 'PAN Card', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '3', name: 'bank_account', description: 'Bank Account', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '4', name: 'driving_license', description: 'Driving License', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '5', name: 'passport', description: 'Passport', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '6', name: 'voter_id', description: 'Voter ID', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '7', name: 'other', description: 'Other', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
];

const initialDocumentStatuses: DocumentStatus[] = [
  { id: '1', name: 'verified', description: 'Document has been verified', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '2', name: 'pending', description: 'Document is pending verification', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
  { id: '3', name: 'failed', description: 'Document verification failed', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2022-01-01T00:00:00Z' },
];

const EmployeeVerificationContext = createContext<EmployeeVerificationContextType | undefined>(undefined);

export const EmployeeVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentTypes, setDocumentTypes] = useState(initialDocumentTypes);
  const [documentStatuses, setDocumentStatuses] = useState(initialDocumentStatuses);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Employee methods
  const addEmployee = useCallback((employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      ...employee,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Employee;

    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(emp => emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp)
    );
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    // Also delete associated documents
    setDocuments(prev => prev.filter(doc => doc.employeeId !== id));
  }, []);

  const getEmployee = useCallback((id: string) => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  // Document methods
  const addDocument = useCallback((document: Omit<Document, 'id'>) => {
    const newDocument = {
      ...document,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Document;

    setDocuments(prev => [...prev, newDocument]);
    return newDocument;
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    setDocuments(prev =>
      prev.map(doc => doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc)
    );
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const getEmployeeDocuments = useCallback((employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  }, [documents]);

  // Simulate API calls
  const fetchEmployeeDocuments = useCallback((employeeId: string) => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const fetchDocumentStatuses = useCallback(() => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const value: EmployeeVerificationContextType = {
    employees,
    documents,
    documentTypes,
    documentStatuses,
    isLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    addDocument,
    updateDocument,
    deleteDocument,
    getEmployeeDocuments,
    fetchEmployeeDocuments,
    fetchDocumentStatuses,
  };

  return (
    <EmployeeVerificationContext.Provider value={value}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (context === undefined) {
    throw new Error('useEmployeeVerification must be used within an EmployeeVerificationProvider');
  }
  return context;
};
