
import { Employee, DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';
import { EmployeeListFilters } from './hooks/useEmployeeManagement';

export interface EmployeeVerificationContextType {
  // Original verification context values
  verifyEmployee: (employeeId: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;

  // Employee management
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<boolean>;
  getEmployee: (id: string) => Employee | undefined;
  fetchEmployees: (filters?: EmployeeListFilters, page?: number) => Promise<Employee[]>;

  // Server-side pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  totalEmployeesCount: number;
  verifiedEmployeesCount: number;
  unverifiedEmployeesCount: number;
  noDocumentsEmployeesCount: number;

  // Document management
  documents: VerificationDocument[];
  addDocument: (document: Omit<VerificationDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VerificationDocument>;
  verifyDocument: (id: string, status: 'verified' | 'failed', method?: 'api' | 'manual', notes?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getEmployeeDocuments: (employeeId: string) => VerificationDocument[];
  fetchEmployeeDocuments: (employeeId: string, timeframe?: string) => Promise<VerificationDocument[]>;

  // Document types and statuses
  documentTypes: DocumentType[];
  documentStatuses: DocumentStatus[];
  fetchDocumentTypes: () => Promise<void>;
  fetchDocumentStatuses: () => Promise<void>;

  // Loading state
  isLoading: boolean;

  // DigiLocker session (client_id/token from Surepass's `initialize` call), cached here
  // so an unconsumed session — Verify was clicked but the popup was closed or failed
  // before completing — survives across VerificationDialog opens/closes and can be
  // retried without minting a new (billable) session. Cleared the moment a session is
  // actually consumed by a completed verification, since Surepass rejects reuse of one
  // ("Access Denied") — confirmed live, not just documented behavior.
  getCachedDigiLockerSession: () => { token: string; clientId: string } | null;
  setCachedDigiLockerSession: (token: string, clientId: string, expirySeconds: number) => void;
  clearCachedDigiLockerSession: () => void;
}

// Re-export types to avoid import confusion
export type { Employee, DocumentType, DocumentStatus, VerificationDocument } from '@/types/employeeVerification';
export type { EmployeeListFilters } from './hooks/useEmployeeManagement';
