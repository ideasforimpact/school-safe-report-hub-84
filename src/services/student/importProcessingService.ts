
import { toast } from 'sonner';
import { Student } from '@/types/student';
import { RawStudentData, ImportResult } from './types/importTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Process the raw student data from Excel/CSV and add valid students to the system
 * Handles both new student insertion and existing student updates
 */
export const processStudentData = async (rawData: RawStudentData[], clientId: string): Promise<ImportResult> => {
  const result: ImportResult = {
    addedStudents: [],
    successCount: 0,
    errorCount: 0,
    errors: [],
    updatedCount: 0
  };

  console.log("Processing student data:", rawData);
  
  if (!clientId) {
    result.errors.push('Client ID is required for processing student data');
    result.errorCount = 1;
    return result;
  }
  
  try {
    // First, identify existing students by student_id for bulk processing
    const studentIds = rawData.map(row => String(row.studentId));
    
    // Fetch all existing students matching these IDs in a single query
    const { data: existingStudents, error: fetchError } = await supabase
      .from('students')
      .select('id, student_id')
      .in('student_id', studentIds)
      .eq('client_id', clientId);
      
    if (fetchError) {
      console.error('Error fetching existing students:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
    
    // Create maps for fast lookups
    const existingStudentsMap = new Map();
    if (existingStudents) {
      existingStudents.forEach(student => {
        existingStudentsMap.set(student.student_id.toLowerCase(), student.id);
      });
    }
    
    // Prepare arrays for bulk operations
    const studentsToCreate: any[] = [];
    const studentsToUpdate: any[] = [];
    const rowErrors: string[] = [];
    
    // Process each row and sort into create/update arrays
    rawData.forEach((row, index) => {
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
          rowErrors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
          return;
        }
        
        // Prepare student data
        const studentData = {
          student_id: String(row.studentId),
          name: String(row.name),
          grade: String(row.grade),
          section: String(row.section),
          campus: String(row.campus),
          client_id: clientId
        };
        
        const studentIdLower = studentData.student_id.toLowerCase();
        const existingId = existingStudentsMap.get(studentIdLower);
        
        if (existingId) {
          // Add to update array
          studentsToUpdate.push({
            ...studentData,
            id: existingId
          });
        } else {
          // Add to create array
          studentsToCreate.push(studentData);
        }
      } catch (error) {
        console.error(`Error processing row ${index + 2}:`, error);
        rowErrors.push(`Row ${index + 2}: ${(error as Error).message || 'Unknown error'}`);
      }
    });
    
    result.errors = rowErrors;
    result.errorCount = rowErrors.length;
    
    // Execute bulk create operation if needed
    if (studentsToCreate.length > 0) {
      const { data: createdData, error: createError } = await supabase
        .from('students')
        .insert(studentsToCreate)
        .select();
        
      if (createError) {
        console.error('Error creating students in bulk:', createError);
        throw new Error(`Failed to add students: ${createError.message}`);
      }
      
      if (createdData) {
        result.addedStudents = result.addedStudents.concat(
          createdData.map(transformStudentData)
        );
        result.successCount = createdData.length;
        console.log(`Successfully added ${createdData.length} new students`);
      }
    }
    
    // Execute bulk update operation if needed
    if (studentsToUpdate.length > 0) {
      // Use the edge function for bulk updates with client_id as query parameter
      const { data: updatedData, error: updateError } = await supabase.functions.invoke('student-management', {
        method: 'POST',
        headers: { path: 'bulk-update' },
        body: {
          students: studentsToUpdate
        },
        query: { client_id: clientId }
      });
        
      if (updateError) {
        console.error('Error updating students in bulk:', updateError);
        throw new Error(`Failed to update students: ${updateError.message}`);
      }
      
      if (updatedData && updatedData.updated) {
        result.updatedCount = updatedData.count || studentsToUpdate.length;
        console.log(`Successfully updated ${result.updatedCount} existing students`);
        
        if (updatedData.students) {
          result.addedStudents = result.addedStudents.concat(updatedData.students);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error in bulk student processing:', error);
    result.errors.push(`Bulk operation error: ${(error as Error).message || 'Unknown error'}`);
    result.errorCount += 1;
    return result;
  }
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
