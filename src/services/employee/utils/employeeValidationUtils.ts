
import { Employee } from '@/contexts/employee/types';
import { 
  EmployeeType, 
  DepartmentType, 
  EmploymentStatus 
} from '@/contexts/employee/types';

// Validate employee data
export const validateEmployeeData = (employeeData: Partial<Employee>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!employeeData.firstName) errors.push('First name is required');
  if (!employeeData.lastName) errors.push('Last name is required');
  if (!employeeData.email) errors.push('Email is required');
  if (!employeeData.employeeId) errors.push('Employee ID is required');
  
  // Email validation
  if (employeeData.email && !isValidEmail(employeeData.email)) {
    errors.push('Invalid email format');
  }

  // Validate employeeType if present
  if (employeeData.employeeType && !isValidEmployeeType(employeeData.employeeType)) {
    errors.push('Invalid employee type');
  }

  // Validate department if present
  if (employeeData.department && !isValidDepartment(employeeData.department)) {
    errors.push('Invalid department');
  }

  // Validate status if present
  if (employeeData.status && !isValidStatus(employeeData.status)) {
    errors.push('Invalid employee status');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Helper functions for validation
export const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

export const isValidEmployeeType = (employeeType: string): boolean => {
  const validTypes: EmployeeType[] = ['permanent', 'contract', 'part_time', 'consultant', 'intern'];
  return validTypes.includes(employeeType as EmployeeType);
};

export const isValidDepartment = (department: string): boolean => {
  const validDepartments: DepartmentType[] = [
    'admin', 
    'teaching', 
    'security', 
    'maintenance', 
    'transport', 
    'management',
    'it',
    'hr',
    'finance'
  ];
  return validDepartments.includes(department as DepartmentType);
};

export const isValidStatus = (status: string): boolean => {
  const validStatuses: EmploymentStatus[] = ['active', 'inactive', 'on_leave'];
  return validStatuses.includes(status as EmploymentStatus);
};

export default validateEmployeeData;
