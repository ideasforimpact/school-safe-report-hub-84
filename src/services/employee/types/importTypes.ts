
import { Employee } from '@/contexts/employee/types';

/**
 * Interface for raw employee data from Excel
 */
export interface RawEmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeType: string;
  department: string;
  joiningDate: string;
  status: string;
  [key: string]: any;
}

/**
 * Interface for import result statistics
 */
export interface ImportResult {
  addedEmployees: Employee[];
  successCount: number;
  errorCount: number;
  errors: string[];
}
