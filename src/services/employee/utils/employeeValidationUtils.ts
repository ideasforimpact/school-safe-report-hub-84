
import { EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

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
    'full-time': 'permanent' as EmployeeType,
    'fulltime': 'permanent' as EmployeeType,
    'full time': 'permanent' as EmployeeType,
    'permanent': 'permanent' as EmployeeType,
    'part-time': 'part_time' as EmployeeType,
    'parttime': 'part_time' as EmployeeType, 
    'part time': 'part_time' as EmployeeType,
    'contractor': 'contract' as EmployeeType,
    'contractual': 'contract' as EmployeeType,
    'contract': 'contract' as EmployeeType,
    'consultant': 'consultant' as EmployeeType,
    'intern': 'intern' as EmployeeType,
    'internship': 'intern' as EmployeeType,
    'temporary': 'contract' as EmployeeType
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
  
  // Map common variations to standard departments
  const deptMap: Record<string, DepartmentType> = {
    'admin': 'admin' as DepartmentType,
    'administration': 'admin' as DepartmentType,
    'teaching': 'teaching' as DepartmentType,
    'teacher': 'teaching' as DepartmentType,
    'faculty': 'teaching' as DepartmentType,
    'security': 'security' as DepartmentType,
    'safety': 'security' as DepartmentType,
    'maintenance': 'maintenance' as DepartmentType,
    'transport': 'transport' as DepartmentType,
    'transportation': 'transport' as DepartmentType,
    'management': 'management' as DepartmentType,
    'it': 'it' as DepartmentType,
    'information technology': 'it' as DepartmentType,
    'hr': 'hr' as DepartmentType,
    'human resources': 'hr' as DepartmentType,
    'finance': 'finance' as DepartmentType,
    'accounting': 'finance' as DepartmentType,
    'operations': 'management' as DepartmentType
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
    'active': 'active' as EmploymentStatus,
    'on leave': 'on_leave' as EmploymentStatus,
    'onleave': 'on_leave' as EmploymentStatus,
    'leave': 'on_leave' as EmploymentStatus,
    'resigned': 'resigned' as EmploymentStatus,
    'terminated': 'terminated' as EmploymentStatus,
    'fired': 'terminated' as EmploymentStatus,
    'retired': 'retired' as EmploymentStatus,
    'inactive': 'inactive' as EmploymentStatus
  };
  
  return (statusMap[normalizedValue] || normalizedValue) as EmploymentStatus;
};
