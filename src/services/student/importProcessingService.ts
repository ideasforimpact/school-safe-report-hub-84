
import { toast } from 'sonner';
import { Student } from '@/types/student';
import { RawStudentData, ImportResult } from './types/importTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Process the raw student data from Excel/CSV and add valid students to the system
 * Handles both new student insertion and existing student updates
 */
export const processStudentData = async (rawData: RawStudentData[]): Promise<ImportResult> => {
  const result: ImportResult = {
    addedStudents: [],
    successCount: 0,
    errorCount: 0,
    errors: [],
    updatedCount: 0
  };

  console.log("Processing student data:", rawData);

  // Process each row
  for (const [index, row] of rawData.entries()) {
    try {
      // Ensure all required fields are present and not empty
      const requiredFields = ['studentId', 'name', 'grade', 'section', 'campus'];
      const missingFields = requiredFields.filter(field => {
        const value = row[field];
        return value === undefined || value === null || 
              (typeof value === 'string' && value.trim() === '') ||
              value === 0;
      });
      
      if (missingFields.length > 0) {
        result.errors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
        result.errorCount++;
        continue;
      }
      
      // Prepare student data
      const studentData = {
        student_id: String(row.studentId),
        name: String(row.name),
        grade: String(row.grade),
        section: String(row.section),
        campus: String(row.campus)
      };
      
      // Check if student already exists by student_id
      const { data: existingStudentById, error: idError } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', studentData.student_id)
        .maybeSingle();
        
      if (idError) {
        console.error(`Error checking for existing student by ID: ${idError.message}`);
        result.errors.push(`Row ${index + 2}: Database error: ${idError.message}`);
        result.errorCount++;
        continue;
      }
      
      console.log(`Row ${index + 2}: Student ${studentData.student_id} exists:`, !!existingStudentById);
      
      if (existingStudentById) {
        // Update existing student
        const { data: updatedStudent, error: updateError } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', existingStudentById.id)
          .select();
          
        if (updateError) {
          console.error(`Error updating student ${studentData.student_id}:`, updateError);
          result.errors.push(`Row ${index + 2}: Failed to update - ${updateError.message || 'Unknown error'}`);
          result.errorCount++;
          continue;
        }
        
        if (updatedStudent && updatedStudent.length > 0) {
          const transformedStudent = transformStudentData(updatedStudent[0]);
          result.addedStudents.push(transformedStudent);
          result.updatedCount++;
          console.log(`Row ${index + 2}: Updated student:`, updatedStudent[0].id);
        }
      } else {
        // Add new student
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert([studentData])
          .select();
          
        if (createError) {
          console.error(`Error adding student ${studentData.student_id}:`, createError);
          result.errors.push(`Row ${index + 2}: Failed to add - ${createError.message || 'Unknown error'}`);
          result.errorCount++;
          continue;
        }
        
        if (newStudent && newStudent.length > 0) {
          const transformedStudent = transformStudentData(newStudent[0]);
          result.addedStudents.push(transformedStudent);
          result.successCount++;
          console.log(`Row ${index + 2}: Added new student:`, newStudent[0].id);
        }
      }
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error);
      result.errors.push(`Row ${index + 2}: ${(error as Error).message || 'Unknown error'}`);
      result.errorCount++;
    }
  }

  console.log("Import result:", result);
  return result;
};

/**
 * Transform database student data to match frontend Student type
 */
const transformStudentData = (dbStudent: any): Student => {
  return {
    id: dbStudent.id,
    studentId: dbStudent.student_id,
    name: dbStudent.name,
    grade: dbStudent.grade,
    section: dbStudent.section,
    campus: dbStudent.campus,
    createdAt: dbStudent.created_at,
    updatedAt: dbStudent.updated_at
  };
};

/**
 * Display appropriate toast notifications for import results
 */
export const showImportResultNotifications = (result: ImportResult): void => {
  // Show success toast for new students
  if (result.successCount > 0) {
    toast.success(`Successfully imported ${result.successCount} new students`);
  }
  
  // Show success toast for updated students
  if (result.updatedCount > 0) {
    toast.success(`Successfully updated ${result.updatedCount} existing students`);
  }
  
  // Show error toasts
  if (result.errors.length > 0) {
    console.error('Import errors:', result.errors);
    if (result.errors.length <= 3) {
      result.errors.forEach(error => toast.error(error));
    } else {
      toast.error(`Failed to process ${result.errors.length} student records. Check console for details.`);
    }
  }
};
