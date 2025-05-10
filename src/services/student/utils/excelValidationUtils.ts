
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
export const validateExcelData = async (data: RawStudentData[]): Promise<string[]> => {
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push('File contains no data');
    return errors;
  }

  console.log('Raw Excel/CSV data:', data);

  // Fetch valid campuses, grades, and sections from database
  const { data: campuses, error: campusError } = await supabase
    .from('campuses')
    .select('name');
  
  if (campusError) {
    console.error('Error fetching campuses:', campusError);
    errors.push('Failed to validate campuses: Database error');
    return errors;
  }

  const { data: grades, error: gradeError } = await supabase
    .from('grades')
    .select('name');
  
  if (gradeError) {
    console.error('Error fetching grades:', gradeError);
    errors.push('Failed to validate grades: Database error');
    return errors;
  }

  const { data: sections, error: sectionError } = await supabase
    .from('sections')
    .select('name');
  
  if (sectionError) {
    console.error('Error fetching sections:', sectionError);
    errors.push('Failed to validate sections: Database error');
    return errors;
  }

  // Create sets for faster lookups
  const validCampuses = new Set(campuses.map(c => c.name.toLowerCase()));
  const validGrades = new Set(grades.map(g => g.name.toLowerCase()));
  const validSections = new Set(sections.map(s => s.name.toLowerCase()));

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

    // Validate campus exists in database
    if (row.campus && typeof row.campus === 'string' && row.campus.trim() !== '') {
      if (!validCampuses.has(row.campus.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Campus "${row.campus}" does not exist in the system`);
      }
    }

    // Validate grade exists in database
    if (row.grade && typeof row.grade === 'string' && row.grade.trim() !== '') {
      if (!validGrades.has(row.grade.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Grade "${row.grade}" does not exist in the system`);
      }
    }

    // Validate section exists in database
    if (row.section && typeof row.section === 'string' && row.section.trim() !== '') {
      if (!validSections.has(row.section.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Section "${row.section}" does not exist in the system`);
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
