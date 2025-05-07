
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
  status: 'pending' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface VerificationDocument {
  id: string;
  employeeId: string;
  documentType: 'aadhar' | 'pan' | 'driving_license' | 'passport' | 'bank_account';
  documentNumber: string;
  documentImage: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationDate?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationDocumentType = 'aadhar' | 'pan' | 'driving_license' | 'passport' | 'bank_account';

export interface VerificationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}
