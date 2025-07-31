
import { RawEmployeeData } from '../types/importTypes';
import { checkBulkEmployeeIdDuplicates } from '../employeeValidationService';

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
 * @param clientId The client ID to check for duplicate employee IDs (optional)
 * @returns Array of validation errors (empty if valid)
 */
export const validateExcelData = async (data: any[], clientId?: string): Promise<string[]> => {
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
  
  // Check for duplicate employee IDs within the file
  const employeeIds = data.map(row => row.employeeId).filter(id => id);
  const duplicateIds = employeeIds.filter((id, index) => employeeIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateIds)];
    uniqueDuplicates.forEach(id => {
      errors.push(`Duplicate employee ID found in file: ${id}`);
    });
  }

  // Check for existing employee IDs in the database if clientId is provided
  if (clientId && employeeIds.length > 0) {
    try {
      const { duplicates, errors: dbErrors } = await checkBulkEmployeeIdDuplicates(employeeIds, clientId);
      
      // Add database errors
      if (dbErrors.length > 0) {
        errors.push(...dbErrors);
      }
      
      // Add duplicate employee ID errors
      if (duplicates.length > 0) {
        duplicates.forEach(id => {
          errors.push(`Employee ID '${id}' already exists for this client`);
        });
      }
    } catch (error) {
      console.error('Error checking bulk employee ID duplicates:', error);
      errors.push('Error validating employee IDs against existing records');
    }
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
