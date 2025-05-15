
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
  employeeType: 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern';
  status: boolean; // Changed from string enum to boolean as per database change
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  documents?: VerificationDocument[]; // Added documents property
  
  // Add these fields to make it compatible with the other Employee type
  firstName: string; // Changed from optional to required to match other Employee type
  lastName: string;  // Changed from optional to required to match other Employee type
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
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationDocument {
  id: string;
  employeeId: string;
  documentTypeId: string;
  documentTypeName?: string;
  documentNumber?: string;
  documentImage: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  documentStatusId?: string;
  documentStatusName?: string;
  verificationDate?: string;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
  employee_docs_log?: Array<{
    timestamp: string;
    action: string;
    response: any;
    notes?: string;
  }>;
  details?: {
    address?: string;
    name?: string;
    dob?: string;
    [key: string]: any;
  };
  params?: {
    DOB?: string;
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
