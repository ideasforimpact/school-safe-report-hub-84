
export interface RawEmployeeData {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employeeType?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  status?: string;
  [key: string]: any;
  moduleAccessPayload?:  string[];
}

export interface ImportResult {
  addedEmployees: any[];
  successCount: number;
  errorCount: number;
  errors: string[];
  updatedCount: number;
}
