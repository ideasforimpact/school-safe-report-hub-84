
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export const initialEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543210',
    dateOfBirth: '1990-05-15',
    address: '123 Main Street, Bangalore',
    joiningDate: '2020-03-10',
    department: 'Engineering',
    position: 'Senior Developer',
    employeeType: 'permanent',
    status: 'verified',
    createdAt: '2023-05-10T08:00:00Z',
    updatedAt: '2023-05-10T08:00:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91 9876543211',
    dateOfBirth: '1992-08-21',
    address: '456 Oak Avenue, Chennai',
    joiningDate: '2021-01-15',
    department: 'Marketing',
    position: 'Marketing Specialist',
    employeeType: 'contract',
    status: 'pending',
    createdAt: '2023-06-15T09:30:00Z',
    updatedAt: '2023-06-15T09:30:00Z'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91 9876543212',
    dateOfBirth: '1988-12-03',
    address: '789 Pine Road, Mumbai',
    joiningDate: '2019-11-20',
    department: 'Finance',
    position: 'Financial Analyst',
    employeeType: 'permanent',
    status: 'failed',
    createdAt: '2023-04-05T10:15:00Z',
    updatedAt: '2023-04-05T10:15:00Z'
  }
];

export const initialDocuments: VerificationDocument[] = [
  {
    id: '1',
    employeeId: '1',
    documentTypeId: '1',
    documentTypeName: 'aadhar',
    documentNumber: '1234 5678 9012',
    documentImage: 'https://example.com/aadhar-image.jpg',
    verificationStatus: 'verified',
    documentStatusId: '2',
    documentStatusName: 'governance',
    verificationDate: '2023-05-15T14:30:00Z',
    verificationNotes: 'All details match with government database.',
    verificationMethod: 'api',
    details: {
      address: '123 Main Street, Bangalore',
      name: 'John Doe',
      dob: '1990-05-15'
    },
    createdAt: '2023-05-12T10:00:00Z',
    updatedAt: '2023-05-15T14:30:00Z'
  },
  {
    id: '2',
    employeeId: '1',
    documentTypeId: '2',
    documentTypeName: 'pan',
    documentNumber: 'ABCDE1234F',
    documentImage: 'https://example.com/pan-image.jpg',
    verificationStatus: 'verified',
    documentStatusId: '2',
    documentStatusName: 'governance',
    verificationDate: '2023-05-16T11:45:00Z',
    verificationNotes: 'PAN details verified successfully.',
    verificationMethod: 'api',
    details: {
      name: 'John Doe',
      father_name: 'Robert Doe'
    },
    createdAt: '2023-05-14T09:30:00Z',
    updatedAt: '2023-05-16T11:45:00Z'
  },
  {
    id: '3',
    employeeId: '2',
    documentTypeId: '1',
    documentTypeName: 'aadhar',
    documentNumber: '9876 5432 1098',
    documentImage: 'https://example.com/aadhar-image-2.jpg',
    verificationStatus: 'pending',
    documentStatusId: '1',
    documentStatusName: 'pending',
    createdAt: '2023-06-18T13:20:00Z',
    updatedAt: '2023-06-18T13:20:00Z'
  },
  {
    id: '4',
    employeeId: '3',
    documentTypeId: '1',
    documentTypeName: 'aadhar',
    documentNumber: '4567 8901 2345',
    documentImage: 'https://example.com/aadhar-image-3.jpg',
    verificationStatus: 'failed',
    documentStatusId: '4',
    documentStatusName: 'rejected',
    verificationDate: '2023-04-10T16:40:00Z',
    verificationNotes: 'Address does not match with provided information.',
    verificationMethod: 'manual',
    createdAt: '2023-04-08T11:15:00Z',
    updatedAt: '2023-04-10T16:40:00Z'
  }
];
