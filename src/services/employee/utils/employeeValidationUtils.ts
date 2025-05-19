
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { EmploymentStatus } from '@/contexts/employee/types';

/**
 * Validate and normalize employee type from import data
 * Maps common variations to standard types
 */
export const validateEmployeeType = (value: string): EmployeeType | null => {
  if (!value) return null;
  
  // Normalize employee type
  const normalizedValue = value.toLowerCase().trim();
  
  // Map common variations to standard types
  const typeMap: Record<string, EmployeeType> = {
    'full-time': 'teaching',
    'fulltime': 'teaching', 
    'full time': 'teaching',
    'permanent': 'permanent',
    'part-time': 'part_time',
    'parttime': 'part_time', 
    'part time': 'part_time',
    'contractor': 'contract',
    'contractual': 'contract',
    'contract': 'contract',
    'consultant': 'consultant',
    'intern': 'intern',
    'internship': 'intern',
    'temporary': 'contract'
  };
  
  return (typeMap[normalizedValue] || normalizedValue) as EmployeeType;
};

/**
 * Validate and normalize department from import data
 */
export const validateDepartment = (value: string): DepartmentType | null => {
  if (!value) return null;
  
  // Normalize department
  const normalizedValue = value.toLowerCase().trim();
  
  // Map common variations to standard departments with correct casing
  const deptMap: Record<string, DepartmentType> = {
    'admin': 'Admin',
    'administration': 'Admin',
    'teaching': 'Teaching',
    'teacher': 'Teaching',
    'faculty': 'Teaching',
    'security': 'Security',
    'safety': 'Security',
    'maintenance': 'maintenance',
    'transport': 'transport',
    'management': 'Management',
    'it': 'Tech',
    'information technology': 'Tech',
    'hr': 'Admin',
    'human resources': 'Admin',
    'finance': 'Admin',
    'accounting': 'Admin',
    'operations': 'Management'
  };
  
  return (deptMap[normalizedValue] || normalizedValue) as DepartmentType;
};

/**
 * Validate and normalize employment status from import data
 */
export const validateEmploymentStatus = (value: string): EmploymentStatus | null => {
  if (!value) return null;
  
  // Normalize status
  const normalizedValue = value.toLowerCase().trim();
  
  // Map common variations to standard statuses
  const statusMap: Record<string, EmploymentStatus> = {
    'active': 'active',
    'on leave': 'on_leave',
    'onleave': 'on_leave',
    'leave': 'on_leave',
    'resigned': 'resigned',
    'terminated': 'terminated',
    'fired': 'terminated',
    'retired': 'retired',
    'inactive': 'inactive'
  };
  
  return (statusMap[normalizedValue] || normalizedValue) as EmploymentStatus;
};
