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
    'full-time': 'permanent',
    'fulltime': 'permanent',
    'full time': 'permanent',
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
  
  // Map common variations to standard departments
  const deptMap: Record<string, DepartmentType> = {
    'admin': 'admin',
    'administration': 'admin',
    'teaching': 'teaching',
    'teacher': 'teaching',
    'faculty': 'teaching',
    'security': 'security',
    'safety': 'security',
    'maintenance': 'maintenance',
    'transport': 'transport',
    'transportation': 'transport',
    'management': 'management',
    'it': 'it',
    'information technology': 'it',
    'hr': 'hr',
    'human resources': 'hr',
    'finance': 'finance',
    'accounting': 'finance',
    'operations': 'management'
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

export const mapExcelDepartmentToEnum = (department: string): DepartmentType => {
  const lowercaseDept = department.toLowerCase().trim();
  
  // Map department Excel values to our enum values
  switch (lowercaseDept) {
    case 'admin':
    case 'administration':
    case 'administration department':
      return 'Admin';
    case 'teaching':
    case 'teacher':
    case 'faculty':
    case 'academic':
    case 'academics':
      return 'Teaching';
    case 'support':
    case 'support staff':
    case 'assistance':
      return 'Support';
    case 'security':
    case 'safety':
    case 'security department':
      return 'Security';
    case 'maintenance':
    case 'facilities':
    case 'upkeep':
    case 'repairs':
      return 'maintenance';
    case 'transport':
    case 'transportation':
    case 'transit':
    case 'bus':
      return 'transport';
    case 'management':
    case 'leadership':
    case 'director':
    case 'principal':
      return 'Management';
    case 'tech':
    case 'technology':
    case 'it':
    case 'information technology':
    case 'computers':
      return 'Tech';
    default:
      return 'Admin'; // Default value
  }
};
