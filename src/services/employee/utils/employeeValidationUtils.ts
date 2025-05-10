
import { EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

/**
 * Validate and normalize employee type from import data
 */
export const validateEmployeeType = (value: string): EmployeeType | null => {
  if (!value) return null;
  
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  
  // Check if it's already a valid EmployeeType
  const validTypes: EmployeeType[] = ['permanent', 'contract', 'part_time', 'consultant', 'intern'];
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
    ft: 'permanent',
    contract: 'contract',
    contractor: 'contract',
    temp: 'contract',
    temporary: 'contract',
    pt: 'contract',
    part_time: 'part_time',
    parttime: 'part_time',
    intern: 'intern',
    internship: 'intern',
    consultant: 'consultant'
  };
  
  // Handle "Full-Time", "Part-Time", etc.
  if (value.toLowerCase().includes('full') && value.toLowerCase().includes('time')) {
    return 'permanent';
  }
  
  if (value.toLowerCase().includes('part') && value.toLowerCase().includes('time')) {
    return 'part_time';
  }
  
  if (value.toLowerCase().includes('contract') || value.toLowerCase().includes('contractor')) {
    return 'contract';
  }
  
  return typeMap[normalizedValue] || null;
};

/**
 * Validate and normalize department from import data
 */
export const validateDepartment = (value: string): DepartmentType | null => {
  if (!value) return null;
  
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  
  // Check if it's already a valid DepartmentType
  const validDepartments: DepartmentType[] = ['admin', 'teaching', 'security', 'maintenance', 'transport', 'management', 'it', 'hr', 'finance'];
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
    academics: 'teaching',
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
    guard: 'admin',
    // Add the contract as a department mapping to a proper department
    contract: 'admin',
    contracts: 'admin',
    contractor: 'admin',
    contracting: 'admin',
    transport: 'transport',
    transportation: 'transport',
    logistics: 'transport',
    driver: 'transport',
    drivers: 'transport',
    bus: 'transport'
  };
  
  return departmentMap[normalizedValue] || null;
};

/**
 * Validate and normalize employment status from import data
 */
export const validateEmploymentStatus = (value: string): EmploymentStatus | null => {
  if (!value) return null;
  
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  
  // Check if it's already a valid EmploymentStatus
  const validStatuses: EmploymentStatus[] = ['active', 'on_leave', 'resigned', 'terminated', 'retired', 'inactive'];
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
    pension: 'retired',
    inactive: 'inactive',
    'not active': 'inactive',
    disabled: 'inactive',
    suspended: 'inactive'
  };
  
  return statusMap[normalizedValue] || null;
};
