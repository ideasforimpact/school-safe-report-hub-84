
export interface EmployeeDocument {
  id: string;
  documentType: string;
  documentNumber?: string;
  documentUrl: string;
  verificationStatus: string;
  employeeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeVerificationContextType {
  isLoading: boolean;
  verifyDocument: (documentId: string, status: string) => Promise<{ success: boolean; error?: any }>;
}
