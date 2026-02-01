
import { supabase } from '@/integrations/supabase/client';
import { RawStudentData } from '../types/importTypes';
import { checkBulkStudentIdDuplicates } from '../studentValidationService';
import { useAuth } from '@/contexts/auth';

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
 * Now includes client-specific duplicate student ID checking
 */
export const validateExcelData = async (data: RawStudentData[], clientId?: string): Promise<{
  errors: string[];
  warnings: string[];
  skippedRowNumbers: Set<number>;
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const skippedRowNumbers = new Set<number>();
  
  const result = () => ({
      errors,
      warnings,
      skippedRowNumbers,
    });
  if (!data || data.length === 0) {
    errors.push('File contains no data');
    return result();
  }

  console.log('Raw Excel/CSV data:', data);

  // Check for client ID availability
  if (!clientId) {
    errors.push('Client information not available. Please ensure you are logged in properly.');
    return result();
  }

  // Validate required fields and collect student IDs for duplicate checking
  const studentIdsToCheck: string[] = [];
  const validRows: { [key: number]: RawStudentData } = {};

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel/CSV is 1-indexed and there's a header row
    
    // Check for required fields
    let hasAllRequiredFields = true;
    for (const field of requiredFields) {
      const fieldValue = row[field];
      const isEmpty = fieldValue === undefined || fieldValue === null || 
                     (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                     (fieldValue === 0);
      
      if (isEmpty) {
        errors.push(`Row ${rowNumber}: ${formatFieldName(String(field))} cannot be empty`);
        hasAllRequiredFields = false;
      }
    }
    
    // If all required fields are present, add to validation list
    if (hasAllRequiredFields) {
      validRows[index] = row;
      studentIdsToCheck.push(String(row.studentId).trim());
    }
  });

  // Early return if there are basic validation errors
  if (errors.length > 0) {
    return result();
  }

  // Check for duplicates within the file itself
  const studentIdCounts = new Map<string, number[]>();
  studentIdsToCheck.forEach((id, index) => {
    const normalizedId = id.toLowerCase();
    if (!studentIdCounts.has(normalizedId)) {
      studentIdCounts.set(normalizedId, []);
    }
    studentIdCounts.get(normalizedId)!.push(index + 2); // +2 for Excel row numbering
  });

  // Report internal duplicates
  studentIdCounts.forEach((rowNumbers, studentId) => {
    if (rowNumbers.length > 1) {
      errors.push(`Student ID "${studentId}" appears multiple times in rows: ${rowNumbers.join(', ')}`);
    }
  });

  // If there are internal duplicates, return early
  if (errors.length > 0) {
    return result();
  }

  // Check for existing student IDs in the database
  const { duplicates, errors: duplicateErrors } = await checkBulkStudentIdDuplicates(studentIdsToCheck, clientId);
  
  // Add duplicate check errors
  errors.push(...duplicateErrors);

  // Report database duplicates with specific student IDs
  if (duplicates.length > 0) {
    duplicates.forEach(duplicateId => {
      const rowIndex = studentIdsToCheck.findIndex(id => id === duplicateId);
      const rowNumber = rowIndex >= 0 ? rowIndex + 2 : undefined;

      if (rowNumber) {
        skippedRowNumbers.add(rowNumber);
        warnings.push(
          `Row ${rowNumber}: Student ID "${duplicateId}" already exists and will be skipped`
        );
      }
    });
  }

  // If there are duplicate errors, return early before API validation
  if (errors.length > 0) {
    return result();
  }

  // Proceed with campus/grade/section validation via API
  try {
    const { data: validationResult, error: validationError } = await supabase.functions.invoke('student-management', {
      method: 'POST',
      headers: { path: 'validate', 'client-id': clientId },
      body: { 
        students: data.map(row => ({
          studentId: String(row.studentId),
          name: String(row.name),
          grade: String(row.grade),
          section: String(row.section),
          campus: String(row.campus)
        })),
        client_id: clientId
      }
    });

    if (validationError) {
      console.error('Validation API error:', validationError);
      errors.push('Failed to validate educational structure: API error');
      return result();
    }

    if (!validationResult.valid && validationResult.errors) {
      errors.push(...validationResult.errors);
      return result();
    }
  } catch (error) {
    console.error('Error during educational structure validation:', error);
    errors.push(`Educational structure validation error: ${(error as Error).message}`);
  }
  
  // Additional individual row validations
  data.forEach((row, index) => {
    const rowNumber = index + 2;
    
    // Validate student ID format
    if (row.studentId && typeof row.studentId === 'string') {
      const studentId = row.studentId.trim();

      if (studentId.length < 2) {
        errors.push(`Row ${rowNumber}: Student ID "${studentId}" is too short`);
      }

      if (studentId.length > 15) {
        errors.push(
          `Row ${rowNumber}: Student ID "${studentId}" should not exceed 15 characters`
        );
      }

      const studentIdRegex = /^[A-Za-z0-9]+$/;

      if (!studentIdRegex.test(studentId)) {
        errors.push(
          `Row ${rowNumber}: Student ID "${studentId}" must not contain spaces or special characters. Only letters and numbers are allowed`
        );
      }
    }

  
    // Validate name format
    if (row.name && typeof row.name === 'string') {
      const name = row.name;

      if (!/^[A-Za-z\s]+$/.test(name)) {
        errors.push(
          `Row ${rowNumber}: Name "${row.name}" must contain only letters and spaces (no numbers or special characters)`
        );
      }

      if (/^\s/.test(name)) {
        errors.push(
          `Row ${rowNumber}: Name "${name}" should not start with a space`
        );
      }

      if (/\d/.test(name)) {
        errors.push(
          `Row ${rowNumber}: Name "${name}" should not contain numbers`
        );
      }

      if (name.length < 2) {
        errors.push(
          `Row ${rowNumber}: Name "${name}" should have at least 2 characters`
        );
      }

      if (name.length > 25) {
        errors.push(
          `Row ${rowNumber}: Name "${name}" should not exceed 25 characters`
        );
      }
    }


  });
  
  return {
    errors,
    warnings,
    skippedRowNumbers
  };
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
