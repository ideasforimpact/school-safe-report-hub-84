
import { EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

/**
 * Validate and normalize employee type from import data
 */
export const validateEmployeeType = (value: string): EmployeeType | null => {
  if (!value) return null;
  
  return value as any; // Accept any value as is
};

/**
 * Validate and normalize department from import data
 */
export const validateDepartment = (value: string): DepartmentType | null => {
  if (!value) return null;
  
  return value as any; // Accept any value as is
};

/**
 * Validate and normalize employment status from import data
 */
export const validateEmploymentStatus = (value: string): EmploymentStatus | null => {
  if (!value) return null;
  
  return value as any; // Accept any value as is
};
