
export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  position: string;
  joiningDate: string;
  employeeType: 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern';
  status: string;
  createdAt: string;
  updatedAt: string;
  documents?: VerificationDocument[];
  clientId: string;
}

export interface VerificationDocument {
  id: string;
  employeeId: string;
  documentTypeId: string;
  documentTypeName?: string;
  documentNumber: string;
  documentImage?: string;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'in-progress' | 'completed';
  documentStatusId?: string;
  documentStatusName?: string;
  verificationDate?: string | null;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
  params?: {
    DOB?: string;
    [key: string]: any;
  };
  employee_docs_log?: Array<{
    timestamp: string;
    action: string;
    response: any;
    notes?: string;
  }>;
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

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  validationRules?: {
    maxSize?: number;
    allowedFormats?: string[];
    expiryRequired?: boolean;
  };
}

export interface VerificationRule {
  id: string;
  documentTypeId: string;
  ruleName: string;
  ruleType: 'format' | 'size' | 'expiry' | 'content';
  ruleValue: string;
  isActive: boolean;
}
