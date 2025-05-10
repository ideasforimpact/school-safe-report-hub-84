
import { RawEmployeeData } from '../types/importTypes';

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
    
    // Validate email format if present
    if (row.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row.email))) {
        errors.push(`Row ${rowNum}: Invalid email format - ${row.email}`);
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
