
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

export const checkEmployeeEmailExists = async (
  email: string,
  clientId: string,
): Promise<boolean> => {
  try {
    if (!email || !clientId) {
      return false;
    }
    
    
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('email', email)
      .eq('client_id', clientId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking employee email existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkEmployeeEmailExists:', error);
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

export const checkBulkEmployeeEmailDuplicates = async (
  emails: string[],
  clientId: string
): Promise<{ duplicates: string[], errors: string[] }> => {
  try {
    if (!emails || emails.length === 0 || !clientId) {
      return { duplicates: [], errors: [] };
    }

    // Normalize → trim → remove empty → dedupe
    const validEmails = [...new Set(
      emails
        .filter(email => typeof email === "string" && email.trim())
        .map(email => email.trim().toLowerCase())  // normalize lowercase
    )];

    if (validEmails.length === 0) {
      return { duplicates: [], errors: [] };
    }

    const { data, error } = await supabase
      .from('employees')
      .select('email')
      .eq('client_id', clientId)
      .in('email', validEmails);

    if (error) {
      console.error("Error checking bulk email duplicates:", error);
      return { duplicates: [], errors: [`Error checking duplicates: ${error.message}`] };
    }

    const existingEmails = data?.map(row => row.email.toLowerCase()) || [];

    return {
      duplicates: existingEmails,
      errors: []
    };
  } catch (error) {
    console.error("Error in checkBulkEmployeeEmailDuplicates:", error);
    return {
      duplicates: [],
      errors: [`Validation error: ${(error as Error).message}`]
    };
  }
};

