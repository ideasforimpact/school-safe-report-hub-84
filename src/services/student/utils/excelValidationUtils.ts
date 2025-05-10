
import { RawStudentData } from '../types/importTypes';

/**
 * Required fields that must be present in the Excel/CSV file
 */
const requiredFields: (keyof RawStudentData)[] = [
  'studentId',
  'name',
  'grade',
  'section',
  'campus'
];

/**
 * Validate Excel/CSV data to ensure all required fields are present and valid
 */
export const validateExcelData = (data: RawStudentData[]): string[] => {
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push('File contains no data');
    return errors;
  }

  console.log('Raw Excel/CSV data:', data);

  // Validate each row in the file
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel/CSV is 1-indexed and there's a header row
    
    // Check for required fields
    for (const field of requiredFields) {
      // More robust check for empty values: handles undefined, null, empty strings and strings with only spaces
      const fieldValue = row[field];
      const isEmpty = fieldValue === undefined || fieldValue === null || 
                     (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                     (fieldValue === 0);
      
      if (isEmpty) {
        errors.push(`Row ${rowNumber}: ${formatFieldName(String(field))} cannot be empty`);
      }
    }
    
    // Add specific validations if needed for student data
    if (row.studentId && row.name) {
      // Validate student ID format if needed
      if (row.studentId && typeof row.studentId === 'string' && row.studentId.length < 2) {
        errors.push(`Row ${rowNumber}: Student ID "${row.studentId}" is too short`);
      }
      
      // Validate name format
      if (row.name && typeof row.name === 'string' && row.name.length < 2) {
        errors.push(`Row ${rowNumber}: Name "${row.name}" is too short`);
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
