
import { RawEmployeeData } from '../types/importTypes';
import { EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';
import { validateEmployeeType, validateDepartment, validateEmploymentStatus } from './employeeValidationUtils';

/**
 * Required fields that must be present in the Excel file
 */
const requiredFields: (keyof RawEmployeeData)[] = [
  'employeeId',
  'firstName',
  'lastName',
  'email',
  'employeeType',
  'department',
  'joiningDate',
  'status'
];

/**
 * Validates the data extracted from Excel
 * @param data The raw data extracted from Excel
 * @returns Array of validation errors (empty if valid)
 */
export const validateExcelData = (data: any[]): string[] => {
  const errors: string[] = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push("No data found in the Excel file");
    return errors;
  }
  
  // Check for required headers/columns
  const requiredColumns = [
    'employeeId', 
    'firstName', 
    'lastName', 
    'email', 
    'employeeType',
    'department',
    'joiningDate',
    'status'
  ];
  
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(
    column => !Object.keys(firstRow).includes(column)
  );
  
  if (missingColumns.length > 0) {
    missingColumns.forEach(column => {
      errors.push(`Missing required column: ${column}`);
    });
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because Excel is 1-based and we're skipping header row
    
    // Check for required fields in each row
    requiredColumns.forEach(column => {
      const value = row[column];
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '') ||
          value === 0) {
        errors.push(`Row ${rowNum}: Missing required value for ${column}`);
      }
    });
    
    // Validate email format
    if (row.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row.email))) {
        errors.push(`Row ${rowNum}: Invalid email format - ${row.email}`);
      }
    }
    
    // Validate employee type using the enhanced validation function
    if (row.employeeType) {
      const validEmployeeType = validateEmployeeType(String(row.employeeType));
      if (!validEmployeeType) {
        errors.push(`Row ${rowNum}: Invalid employee type - ${row.employeeType}. Expected: permanent, contract, part_time, consultant, or intern`);
      }
    }
    
    // Validate department using the enhanced validation function
    if (row.department) {
      const validDepartment = validateDepartment(String(row.department));
      if (!validDepartment) {
        errors.push(`Row ${rowNum}: Invalid department - ${row.department}. Expected: admin, teaching, security, maintenance, transport, management, it, hr, or finance`);
      }
    }
    
    // Validate status if present
    if (row.status) {
      const validStatus = validateEmploymentStatus(String(row.status));
      if (!validStatus) {
        errors.push(`Row ${rowNum}: Invalid status - ${row.status}. Expected: active, on_leave, resigned, terminated, retired, or inactive`);
      }
    }
  });
  
  return errors;
};

/**
 * Format field name for display in error messages
 */
const formatFieldName = (field: string): string => {
  const formatted = field
    // Insert spaces before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Capitalize first letter
    .replace(/^./, (str) => str.toUpperCase());
  
  return formatted.trim();
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
