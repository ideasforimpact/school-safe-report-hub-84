
/**
 * Raw data structure from Excel import
 */
export interface RawEmployeeData {
  [key: string]: any;
  employeeId?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | number;
  employeeType?: string;
  department?: string;
  joiningDate?: string | number | Date;
  status?: string;
}

/**
 * Results of the import operation
 */
export interface ImportResult {
  addedEmployees: any[];
  successCount: number;
  updatedCount: number; // New counter for updated employees
  errorCount: number;
  errors: string[];
}
