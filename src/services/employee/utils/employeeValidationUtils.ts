
import { EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

/**
 * Validate and normalize employee type from import data
 */
export const validateEmployeeType = (value: string): EmployeeType | null => {
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if it's already a valid EmployeeType
  const validTypes: EmployeeType[] = ['permanent', 'contract', 'intern'];
  if (validTypes.includes(normalizedValue as EmployeeType)) {
    return normalizedValue as EmployeeType;
  }
  
  // Handle common variations
  const typeMap: Record<string, EmployeeType> = {
    permanent: 'permanent',
    perm: 'permanent',
    full_time: 'permanent',
    fulltime: 'permanent',
    'full-time': 'permanent',
    contract: 'contract',
    contractor: 'contract',
    temp: 'contract',
    temporary: 'contract',
    intern: 'intern',
    internship: 'intern'
  };
  
  return typeMap[normalizedValue] || null;
};

/**
 * Validate and normalize department from import data
 */
export const validateDepartment = (value: string): DepartmentType | null => {
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if it's already a valid DepartmentType
  const validDepartments: DepartmentType[] = ['admin', 'teaching', 'management', 'it', 'finance', 'hr'];
  if (validDepartments.includes(normalizedValue as DepartmentType)) {
    return normalizedValue as DepartmentType;
  }
  
  // Handle common variations
  const departmentMap: Record<string, DepartmentType> = {
    admin: 'admin',
    administration: 'admin',
    administrative: 'admin',
    teach: 'teaching',
    teaching: 'teaching',
    faculty: 'teaching',
    teacher: 'teaching',
    educator: 'teaching',
    professor: 'teaching',
    support: 'admin',
    support_staff: 'admin',
    'support staff': 'admin',
    management: 'management',
    manager: 'management',
    it: 'it',
    tech: 'it',
    technology: 'it',
    information_technology: 'it',
    'information technology': 'it',
    finance: 'finance',
    accounting: 'finance',
    financial: 'finance',
    hr: 'hr',
    'human resources': 'hr',
    human_resources: 'hr',
    facilities: 'admin',
    facility: 'admin',
    maintenance: 'admin',
    security: 'admin',
    safety: 'admin',
    guard: 'admin'
  };
  
  return departmentMap[normalizedValue] || null;
};

/**
 * Validate and normalize employment status from import data
 */
export const validateEmploymentStatus = (value: string): EmploymentStatus | null => {
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if it's already a valid EmploymentStatus
  const validStatuses: EmploymentStatus[] = ['active', 'on_leave', 'resigned', 'terminated', 'retired'];
  if (validStatuses.includes(normalizedValue as EmploymentStatus)) {
    return normalizedValue as EmploymentStatus;
  }
  
  // Handle common variations
  const statusMap: Record<string, EmploymentStatus> = {
    active: 'active',
    current: 'active',
    employed: 'active',
    working: 'active',
    on_leave: 'on_leave',
    leave: 'on_leave',
    'on leave': 'on_leave',
    resigned: 'resigned',
    quit: 'resigned',
    left: 'resigned',
    terminated: 'terminated',
    fired: 'terminated',
    dismissed: 'terminated',
    retired: 'retired',
    pension: 'retired'
  };
  
  return statusMap[normalizedValue] || null;
};
