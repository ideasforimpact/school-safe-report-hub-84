
import { DocumentType, DocumentStatus } from './types';

// Initial document types for the context
export const initialDocumentTypes: DocumentType[] = [
  {
    id: '1',
    name: 'Aadhar Card',
    description: 'Indian national identity card',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'PAN Card',
    description: 'Permanent Account Number card for tax purposes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Passport',
    description: 'International travel document',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Driver License',
    description: 'License to operate motor vehicles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial document statuses for the context
export const initialDocumentStatuses: DocumentStatus[] = [
  {
    id: '1',
    name: 'Pending',
    description: 'Document is awaiting verification',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Verified',
    description: 'Document has been successfully verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Failed',
    description: 'Document verification has failed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Expired',
    description: 'Document has expired and needs renewal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Add initial employees data
export const initialEmployees = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543210',
    dateOfBirth: '1990-01-01',
    address: '123 Main Street, Mumbai',
    joiningDate: '2022-01-15',
    department: 'Engineering',
    position: 'Senior Developer',
    employeeType: 'permanent' as const,
    status: 'verified' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91 9123456780',
    dateOfBirth: '1992-05-15',
    address: '456 Park Avenue, Delhi',
    joiningDate: '2022-02-01',
    department: 'Human Resources',
    position: 'HR Manager',
    employeeType: 'permanent' as const,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Add initial documents data
export const initialDocuments = [
  {
    id: '1',
    employeeId: '1',
    documentTypeId: '1',
    documentTypeName: 'Aadhar Card',
    documentNumber: '1234 5678 9012',
    documentImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    documentStatusId: '2',
    documentStatusName: 'Verified',
    verificationStatus: 'verified' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    employeeId: '1',
    documentTypeId: '2',
    documentTypeName: 'PAN Card',
    documentNumber: 'ABCDE1234F',
    documentImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    documentStatusId: '1',
    documentStatusName: 'Pending',
    verificationStatus: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
