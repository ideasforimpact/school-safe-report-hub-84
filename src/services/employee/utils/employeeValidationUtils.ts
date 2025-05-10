
import { EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

/**
 * Validate and normalize employee type from import data
 * For bulk imports, we'll accept any value as is without validation
 */
export const validateEmployeeType = (value: string): EmployeeType | null => {
  if (!value) return null;
  
  // Accept any value as is for bulk imports
  return value as any;
};

/**
 * Validate and normalize department from import data
 * For bulk imports, we'll accept any value as is without validation
 */
export const validateDepartment = (value: string): DepartmentType | null => {
  if (!value) return null;
  
  // Accept any value as is for bulk imports
  return value as any;
};

/**
 * Validate and normalize employment status from import data
 * For bulk imports, we'll accept any value as is without validation
 */
export const validateEmploymentStatus = (value: string): EmploymentStatus | null => {
  if (!value) return null;
  
  // Accept any value as is for bulk imports
  return value as any;
};
