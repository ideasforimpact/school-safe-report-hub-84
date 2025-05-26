
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

interface ImportResult {
  addedStudents: Student[];
  updatedStudents: Student[];
  errors: string[];
  totalProcessed: number;
}

/**
 * Process student data for import using bulk operations
 */
export const processStudentData = async (studentData: any[]): Promise<ImportResult> => {
  // Get client_id from auth context
  const { employeeData } = useAuth();
  
  if (!employeeData?.clientId) {
    throw new Error('Client ID is required for student import');
  }

  const result: ImportResult = {
    addedStudents: [],
    updatedStudents: [],
    errors: [],
    totalProcessed: 0
  };

  try {
    // Add client_id to all student records
    const studentsWithClientId = studentData.map(student => ({
      ...student,
      client_id: employeeData.clientId
    }));

    // Use bulk-update endpoint for processing
    const { data, error } = await supabase.functions.invoke('student-management', {
      body: {
        students: studentsWithClientId,
        client_id: employeeData.clientId
      },
      method: 'POST',
      headers: { 
        path: 'bulk-update',
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      throw error;
    }

    result.addedStudents = data.students || [];
    result.totalProcessed = data.count || 0;
    
    return result;
  } catch (error) {
    console.error('Error in processStudentData:', error);
    throw error;
  }
};

/**
 * Show appropriate notifications based on import results
 */
export const showImportResultNotifications = (result: ImportResult) => {
  const { addedStudents, updatedStudents, errors, totalProcessed } = result;
  
  if (errors.length > 0) {
    toast.error(`Import completed with ${errors.length} errors. ${totalProcessed} records processed.`);
  } else if (addedStudents.length > 0 || updatedStudents.length > 0) {
    toast.success(`Import successful! Added: ${addedStudents.length}, Updated: ${updatedStudents.length}`);
  } else {
    toast.info('Import completed with no changes.');
  }
};
