
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export const initialEmployees: Employee[] = [
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

export const initialDocuments: VerificationDocument[] = [
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
