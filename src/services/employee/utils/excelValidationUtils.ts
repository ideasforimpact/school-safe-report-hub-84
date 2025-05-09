
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
 * Validate Excel data to ensure all required fields are present and valid
 */
export const validateExcelData = (data: RawEmployeeData[]): string[] => {
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push('Excel file contains no data');
    return errors;
  }

  console.log('Raw Excel data:', data); // Add logging to debug the issue

  // Validate each row in the Excel file
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and there's a header row
    
    // Check for required fields
    for (const field of requiredFields) {
      // More robust check for empty values: handles undefined, null, empty strings and strings with only spaces
      const fieldValue = row[field];
      const isEmpty = fieldValue === undefined || fieldValue === null || 
                     (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                     (fieldValue === 0);
      
      if (isEmpty) {
        // Fix the error by explicitly casting field to string
        errors.push(`Row ${rowNumber}: ${formatFieldName(String(field))} cannot be empty`);
      }
    }
    
    // Only proceed with further validation if we have values for the required fields
    // Use more lenient checking to avoid false validation errors
    if (row.employeeId && row.employeeType && row.department && row.status && row.email) {
      // Validate employee type
      const validEmployeeType = validateEmployeeType(String(row.employeeType));
      if (!validEmployeeType) {
        errors.push(`Row ${rowNumber}: Invalid employee type "${row.employeeType}"`);
      }
      
      // Validate department
      const validDepartment = validateDepartment(String(row.department));
      if (!validDepartment) {
        errors.push(`Row ${rowNumber}: Invalid department "${row.department}"`);
      }
      
      // Validate status
      const validStatus = validateEmploymentStatus(String(row.status));
      if (!validStatus) {
        errors.push(`Row ${rowNumber}: Invalid status "${row.status}"`);
      }
      
      // Validate email format
      if (!isValidEmail(String(row.email))) {
        errors.push(`Row ${rowNumber}: Invalid email format "${row.email}"`);
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

