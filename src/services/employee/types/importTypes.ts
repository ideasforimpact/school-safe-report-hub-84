
import { Employee, EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';

export interface RawEmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeType: EmployeeType | string;
  department: DepartmentType | string;
  joiningDate: string | number; // Can be string date or Excel number
  status: EmploymentStatus | string;
  clientId?: string; // Add clientId field
  modulePermissions?: ModulePermissions;
}

export interface ImportResult {
  addedEmployees: Employee[];
  successCount: number;
  errorCount: number;
  errors: string[];
  updatedCount: number;
}
