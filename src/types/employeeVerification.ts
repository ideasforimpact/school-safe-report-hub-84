
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  joiningDate: string;
  department: string;
  position?: string;
  employeeType: 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern';
  status: boolean; // Boolean value for active status
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  documents?: VerificationDocument[]; // Added documents property
  
  // Add these fields to make it compatible with the other Employee type
  firstName?: string;
  lastName?: string;
  isSuperAdmin?: boolean; // Added this property to fix the error
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
  documentImage: string; // This should always be required and not null
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
  // Cron-related fields
  cronActivate?: boolean;
  cronActivatedDate?: string;
  cronUpdatedDate?: string;
  cronLog?: Array<{
    timestamp: string;
    action: string;
    status: string;
    details?: any;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type VerificationDocumentType = 'aadhar' | 'pan' | 'driving_license' | 'passport' | 'bank_account' | 'voter_id' | 'other';

export interface VerificationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}
