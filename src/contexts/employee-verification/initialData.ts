
import { Employee, VerificationDocument, DocumentType, DocumentStatus } from './types';

// Initial empty employees array
export const initialEmployees: Employee[] = [];

// Initial empty documents array
export const initialDocuments: VerificationDocument[] = [];

// Initial document types
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
    name: 'driving_license',
    description: 'Driving License',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'passport',
    description: 'Passport',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'bank_account',
    description: 'Bank Account',
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

// Initial document statuses
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
    description: 'Document is verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'failed',
    description: 'Document verification failed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
