
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
