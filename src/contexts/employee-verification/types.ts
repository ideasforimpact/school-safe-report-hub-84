
// Basic types for employee verification context
export interface EmployeeVerificationContextType {
  // Define the minimum required interface for the context
  employees: any[];
  documents: any[];
  isLoading: boolean;
  error: Error | null;
}
