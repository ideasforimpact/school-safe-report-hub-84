
import { supabase } from '@/integrations/supabase/client';
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
export const validateExcelData = async (data: RawStudentData[], clientId: string): Promise<string[]> => {
  const errors: string[] = [];
  
  if (!clientId) {
    errors.push('Client ID is required for validation');
    return errors;
  }
  
  if (!data || data.length === 0) {
    errors.push('File contains no data');
    return errors;
  }

  console.log('Raw Excel/CSV data:', data);

  // Extract all unique campuses, grades, and sections from the data for bulk validation
  const uniqueCampuses = new Set();
  const uniqueGrades = new Set();
  const uniqueSections = new Set();
  
  // Map to track relationships between campuses, grades, and sections
  const campusGradeMap = new Map(); // campus -> grades
  const gradeSectionMap = new Map(); // grade -> sections
  
  // First check for required fields and collect unique values
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel/CSV is 1-indexed and there's a header row
    
    // Check for required fields
    for (const field of requiredFields) {
      const fieldValue = row[field];
      const isEmpty = fieldValue === undefined || fieldValue === null || 
                     (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                     (fieldValue === 0);
      
      if (isEmpty) {
        errors.push(`Row ${rowNumber}: ${formatFieldName(String(field))} cannot be empty`);
      }
    }
    
    // Add unique values to sets
    if (row.campus && typeof row.campus === 'string' && row.campus.trim() !== '') {
      uniqueCampuses.add(row.campus.toLowerCase());
    }
    
    if (row.grade && typeof row.grade === 'string' && row.grade.trim() !== '') {
      uniqueGrades.add(row.grade.toLowerCase());
      
      // Track campus-grade relationship
      if (row.campus) {
        const campusKey = row.campus.toLowerCase();
        if (!campusGradeMap.has(campusKey)) {
          campusGradeMap.set(campusKey, new Set());
        }
        campusGradeMap.get(campusKey).add(row.grade.toLowerCase());
      }
    }
    
    if (row.section && typeof row.section === 'string' && row.section.trim() !== '') {
      uniqueSections.add(row.section.toLowerCase());
      
      // Track grade-section relationship
      if (row.grade) {
        const gradeKey = row.grade.toLowerCase();
        if (!gradeSectionMap.has(gradeKey)) {
          gradeSectionMap.set(gradeKey, new Set());
        }
        gradeSectionMap.get(gradeKey).add(row.section.toLowerCase());
      }
    }
  });

  // If there are already errors from required fields validation, return early
  if (errors.length > 0) {
    return errors;
  }

  try {
    // Use the bulk validation endpoint to validate all relationships at once
    const { data: validationResult, error: validationError } = await supabase.functions.invoke('student-management', {
      method: 'POST',
      headers: { path: 'validate' },
      body: { 
        students: data.map(row => ({
          studentId: String(row.studentId),
          name: String(row.name),
          grade: String(row.grade),
          section: String(row.section),
          campus: String(row.campus)
        }))
      },
      query: { client_id: clientId }
    });

    if (validationError) {
      console.error('Validation API error:', validationError);
      errors.push('Failed to validate data: API error');
      return errors;
    }

    if (!validationResult.valid && validationResult.errors) {
      return validationResult.errors;
    }
  } catch (error) {
    console.error('Error during validation:', error);
    errors.push(`Validation error: ${(error as Error).message}`);
  }
  
  // Validate each row individually for name and studentId format
  data.forEach((row, index) => {
    const rowNumber = index + 2;
    
    // Add specific validations for student data
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
