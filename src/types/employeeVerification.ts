
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
  clientId?: string; // Added clientId field
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
  name: 'pending' | 'governance' | 'manual' | 'rejected';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationDocument {
  id: string;
  employeeId: string;
  documentTypeId: string; // Changed from documentType
  documentTypeName?: string; // For display purposes
  documentNumber?: string;
  documentImage: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  documentStatusId?: string; // Added to reference document_status
  documentStatusName?: 'pending' | 'governance' | 'manual' | 'rejected'; // For display purposes
  verificationDate?: string;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
  details?: {
    address?: string;
    name?: string;
    dob?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export type VerificationDocumentType = 'aadhar' | 'pan' | 'driving_license' | 'passport' | 'bank_account' | 'voter_id' | 'other';

export interface VerificationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}
