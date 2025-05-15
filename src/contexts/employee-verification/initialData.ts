
import { DocumentType, DocumentStatus, Employee, VerificationDocument } from '@/types/employeeVerification';
import { v4 as uuidv4 } from 'uuid';

// Initial document types for the application
export const initialDocumentTypes: DocumentType[] = [
  {
    id: '1',
    name: 'aadhar',
    description: 'Aadhar Card',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'pan',
    description: 'PAN Card',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'bank_account',
    description: 'Bank Account',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'driving_license',
    description: 'Driving License',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'passport',
    description: 'Passport',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'voter_id',
    description: 'Voter ID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'other',
    description: 'Other',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial document statuses for the application
export const initialDocumentStatuses: DocumentStatus[] = [
  {
    id: '1',
    name: 'pending',
    description: 'Document is pending verification',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'verified',
    description: 'Document has been verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'rejected',
    description: 'Document has been rejected',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'expired',
    description: 'Document has expired',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample employee data for testing
export const initialEmployees: Employee[] = [
  {
    id: uuidv4(),
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    dateOfBirth: '1990-01-15',
    address: '123 Main St, City, State',
    joiningDate: '2020-03-10',
    department: 'Engineering',
    position: 'Software Developer',
    employeeType: 'permanent',
    status: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '8765432109',
    dateOfBirth: '1992-05-20',
    address: '456 Oak St, City, State',
    joiningDate: '2021-02-15',
    department: 'Marketing',
    position: 'Marketing Manager',
    employeeType: 'permanent',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample document data for testing
export const initialDocuments: VerificationDocument[] = [];
