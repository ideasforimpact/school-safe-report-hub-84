
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  dateOfBirth?: string;
  address?: string;
  personalDetails?: {
    middleName?: string;
    fatherName?: string;
    staffId?: string;
    experience?: string;
    qualification?: string;
    gender?: string;
    dob?: string;
    religion?: string;
    nationality?: string;
    bloodGroup?: string;
    residenceAddress?: string;
  };
  professionalOtherDetails?: {
    aadharNo?: string;
    panNo?: string;
    esiNo?: string;
    pfNo?: string;
    exitDate?: string;
    biometricUserId?: string;
  };
  joiningDate: string;
  department: string;
  position?: string;
  employeeType: 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern';
  status: boolean; // Boolean value for active status
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  documents?: VerificationDocument[]; // Added documents property
  profileDocuments?: Array<{
    label: string;
    fileName: string;
    uploadedAt: string;
  }>;
  
  // Add these fields to make it compatible with the other Employee type
  firstName?: string;
  lastName?: string;
  aadharVerifiedName?: string;
  isSuperAdmin?: boolean; // Added this property to fix the error
  isCpdInvolved?: boolean;
  
  // SOP Statistics
  sopStatistics?: {
    totalSOPs: number;
    totalSOPsSignedOff: number;
    totalSOPsToBeDone: number;
  };
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
  verificationStatus: 'pending' | 'verified' | 'failed' | 'in-progress' | 'completed' | 'rejected';
  documentStatusId?: string;
  documentStatusName?: string;
  verificationDate?: string;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
  rejectReason?: string;
  employee_docs_log?: Array<{
    timestamp: string;
    action: string;
    response: unknown;
    notes?: string;
  }>;
  // Latest successful quickekyc/surepass verification response for this document,
  // from employee_verification_audit_log.latest_success_log (null if never verified via API).
  latestSuccessLog?: {
    provider?: 'quickekyc' | 'surepass';
    status_code?: number;
    response?: {
      success?: boolean;
      status_code?: number;
      data?: unknown;
      [key: string]: unknown;
    };
    document_type_id?: string;
    document_type_name?: string;
    document_number?: string;
    document_context?: Record<string, unknown>;
  } | null;
  details?: {
    address?: string;
    name?: string;
    dob?: string;
    [key: string]: unknown;
  };
  params?: {
    DOB?: string;
    verification_history?: Array<{
      action: 'completed' | 'rejected';
      comments: string;
      attachments: string[];
      timestamp: string;
      verified_by: string;
    }>;
    [key: string]: unknown;
  };
  // Cron-related fields
  cronActivate?: boolean;
  cronActivatedDate?: string;
  cronUpdatedDate?: string;
  cronLog?: Array<{
    timestamp: string;
    action: string;
    status: string;
    details?: unknown;
    error?: string;
  }>;
  // New API response tracking fields
  apiResponseData?: unknown;
  apiVerificationStatus?: 'pending' | 'completed' | 'failed' | null;
  apiVerificationDate?: string;
  apiVerificationMethod?: string;
  bothFallback?: boolean;
  latestStatusCode?: number | null;
  verifiedByEmployeeId?: string; // Track which employee verified this document
  documents_files?: Array<{
    fileName: string;
    size: number;
    url?: string;
    path?: string;
  }>;
  comments?: Array<{
    id: string;
    text: string;
    sentiment: boolean; // true for positive, false for negative
    filePaths: string[]; // Array of storage paths
  }>;
  personalInfo?: {
    dob?: string;
    address?: string;
  };
  lastOtpGenerated?: string; // Timestamp when OTP was last generated
  createdAt: string;
  updatedAt: string;
  audit?: Record<string, unknown>;
}

export type VerificationDocumentType = 'aadhar' | 'pan' | 'driving_license' | 'passport' | 'bank_account' | 'voter_id' | 'manual' | 'other_documents';

export interface VerificationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
