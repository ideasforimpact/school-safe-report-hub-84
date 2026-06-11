
import { supabase } from '@/integrations/supabase/client';

export const checkStudentIdExists = async (studentId: string, clientId: string): Promise<boolean> => {
  try {
    if (!studentId || !clientId) {
      return false;
    }

    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', studentId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      console.error('Error checking student ID existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkStudentIdExists:', error);
    return false;
  }
};

/**
 * Bulk check for duplicate student IDs within a client
 */
export const checkBulkStudentIdDuplicates = async (
  studentIds: string[], 
  clientId: string
): Promise<{ duplicates: string[], errors: string[] }> => {
  try {
    if (!studentIds || studentIds.length === 0 || !clientId) {
      return { duplicates: [], errors: [] };
    }

    // Remove empty or invalid student IDs and create unique list
    const validStudentIds = [...new Set(studentIds.filter(id => id && typeof id === 'string' && id.trim()))];
    
    if (validStudentIds.length === 0) {
      return { duplicates: [], errors: [] };
    }

    const { data, error } = await supabase
      .from('students')
      .select('student_id')
      .eq('client_id', clientId)
      .in('student_id', validStudentIds);

    if (error) {
      console.error('Error checking bulk student ID duplicates:', error);
      return { duplicates: [], errors: [`Error checking duplicates: ${error.message}`] };
    }

    const existingStudentIds = data?.map(student => student.student_id) || [];
    
    return { 
      duplicates: existingStudentIds,
      errors: []
    };
  } catch (error) {
    console.error('Error in checkBulkStudentIdDuplicates:', error);
    return { 
      duplicates: [], 
      errors: [`Validation error: ${(error as Error).message}`] 
    };
  }
};
