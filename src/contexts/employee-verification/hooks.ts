
import { useState } from 'react';

// Employee types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  employeeType: string;
  department: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'Pending';
}

// Document types
export interface Document {
  id: string;
  employeeId: string;
  documentType: string;
  documentUrl: string;
  verificationStatus: 'Verified' | 'Unverified' | 'Rejected' | 'Pending';
  documentNumber?: string;
}

// Initial data
export const initialEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    employeeId: 'EMP001',
    employeeType: 'Full Time',
    department: 'Administration',
    joiningDate: '2022-01-15',
    status: 'Active'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    employeeId: 'EMP002',
    employeeType: 'Contract',
    department: 'Teaching',
    joiningDate: '2022-03-22',
    status: 'Active'
  }
];

export const initialDocuments: Document[] = [
  {
    id: '1',
    employeeId: '1',
    documentType: 'ID Card',
    documentUrl: '/images/placeholder-doc.jpg',
    verificationStatus: 'Verified',
    documentNumber: '12345678'
  },
  {
    id: '2',
    employeeId: '1',
    documentType: 'Certificate',
    documentUrl: '/images/placeholder-doc.jpg',
    verificationStatus: 'Pending'
  },
  {
    id: '3',
    employeeId: '2',
    documentType: 'ID Card',
    documentUrl: '/images/placeholder-doc.jpg',
    verificationStatus: 'Unverified',
    documentNumber: '87654321'
  }
];

// Employee management hook
export const useEmployeeManagement = (
  initialState: Employee[],
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
) => {
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      ...employee,
      id: Math.random().toString(36).substr(2, 9)
    };
    setEmployees(prev => [...prev, newEmployee as Employee]);
    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, ...updates } : emp))
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  return {
    addEmployee,
    updateEmployee,
    deleteEmployee
  };
};

// Document management hook
export const useDocumentManagement = (
  initialState: Document[],
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const addDocument = (document: Omit<Document, 'id'>) => {
    const newDocument = {
      ...document,
      id: Math.random().toString(36).substr(2, 9)
    };
    setDocuments(prev => [...prev, newDocument as Document]);
    return newDocument;
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments(prev =>
      prev.map(doc => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getEmployeeDocuments = (employeeId: string) => {
    return initialState.filter(doc => doc.employeeId === employeeId);
  };

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    getEmployeeDocuments
  };
};
