
import { supabase } from '@/integrations/supabase/client';

export const checkStudentIdExists = async (studentId: string, clientId: string): Promise<boolean> => {
  try {
    if (!studentId || !clientId) {
      return false;
    }

    const { data, error } = await supabase.functions.invoke('student-management', {
      body: { studentId, client_id: clientId },
      headers: { path: 'validate-id' }
    });

    if (error) {
      console.error('Error checking student ID existence via edge function:', error);
      return false;
    }

    return data.exists || false;
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

    const { data, error } = await supabase.functions.invoke('student-management', {
      body: { studentIds: validStudentIds, client_id: clientId },
      headers: { path: 'bulk-check-ids' }
    });

    if (error) {
      console.error('Error checking bulk student ID duplicates via edge function:', error);
      return { duplicates: [], errors: [`Error checking duplicates: ${error.message}`] };
    }

    const existingStudentIds = data.duplicates || [];
    
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
