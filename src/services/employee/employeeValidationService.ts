
import { supabase } from '@/integrations/supabase/client';

export const checkEmployeeIdExists = async (employeeId: string, clientId: string): Promise<boolean> => {
  try {
    if (!employeeId || !clientId) {
      return false;
    }

    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      console.error('Error checking employee ID existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkEmployeeIdExists:', error);
    return false;
  }
};

/**
 * Bulk check for duplicate employee IDs within a client
 */
export const checkBulkEmployeeIdDuplicates = async (
  employeeIds: string[], 
  clientId: string
): Promise<{ duplicates: string[], errors: string[] }> => {
  try {
    if (!employeeIds || employeeIds.length === 0 || !clientId) {
      return { duplicates: [], errors: [] };
    }

    // Remove empty or invalid employee IDs and create unique list
    const validEmployeeIds = [...new Set(employeeIds.filter(id => id && typeof id === 'string' && id.trim()))];
    
    if (validEmployeeIds.length === 0) {
      return { duplicates: [], errors: [] };
    }

    const { data, error } = await supabase
      .from('employees')
      .select('employee_id')
      .eq('client_id', clientId)
      .in('employee_id', validEmployeeIds);

    if (error) {
      console.error('Error checking bulk employee ID duplicates:', error);
      return { duplicates: [], errors: [`Error checking duplicates: ${error.message}`] };
    }

    const existingEmployeeIds = data?.map(employee => employee.employee_id) || [];
    
    return { 
      duplicates: existingEmployeeIds,
      errors: []
    };
  } catch (error) {
    console.error('Error in checkBulkEmployeeIdDuplicates:', error);
    return { 
      duplicates: [], 
      errors: [`Validation error: ${(error as Error).message}`] 
    };
  }
};
