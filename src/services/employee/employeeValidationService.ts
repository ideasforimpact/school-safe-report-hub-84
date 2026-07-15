
import { supabase } from '@/integrations/supabase/client';

// Live single-field "already exists" checks (Add/Edit User dialogs). Both
// route through checkBulkDuplicates (edge function) with a single-item array
// rather than querying `employees` directly from the browser.
export const checkEmployeeIdExists = async (employeeId: string, clientId: string): Promise<boolean> => {
  if (!employeeId || !clientId) {
    return false;
  }

  const { duplicateEmployeeIds } = await checkBulkDuplicates([employeeId], [], clientId);
  return duplicateEmployeeIds.length > 0;
};

export const checkEmployeeEmailExists = async (
  email: string,
  clientId: string,
): Promise<boolean> => {
  if (!email || !clientId) {
    return false;
  }

  const { duplicateEmails } = await checkBulkDuplicates([], [email], clientId);
  return duplicateEmails.length > 0;
};
/**
 * Bulk check for duplicate employee IDs and/or emails within a client.
 * Routes through the `employee-management` edge function (operation:
 * 'check_duplicates') instead of querying the `employees` table directly
 * from the browser, in a single call for both fields.
 */
export const checkBulkDuplicates = async (
  employeeIds: string[],
  emails: string[],
  clientId: string
): Promise<{ duplicateEmployeeIds: string[]; duplicateEmails: string[]; errors: string[] }> => {
  const validEmployeeIds = [...new Set((employeeIds || []).filter(id => id && typeof id === 'string' && id.trim()))];
  const validEmails = [...new Set(
    (emails || [])
      .filter(email => typeof email === 'string' && email.trim())
      .map(email => email.trim().toLowerCase())
  )];

  if (validEmployeeIds.length === 0 && validEmails.length === 0) {
    return { duplicateEmployeeIds: [], duplicateEmails: [], errors: [] };
  }

  try {
    const { data, error } = await supabase.functions.invoke('employee-management', {
      body: JSON.stringify({
        operation: 'check_duplicates',
        clientId,
        employeeIds: validEmployeeIds,
        emails: validEmails,
      }),
    });

    if (error) throw error;
    if (!data?.success) throw new Error('Failed to check duplicates');

    return {
      duplicateEmployeeIds: data.duplicateEmployeeIds || [],
      duplicateEmails: data.duplicateEmails || [],
      errors: [],
    };
  } catch (error) {
    console.error('Error in checkBulkDuplicates:', error);
    return {
      duplicateEmployeeIds: [],
      duplicateEmails: [],
      errors: [`Validation error: ${(error as Error).message}`],
    };
  }
};

export const checkSuperAdminEmailExists = async (
  email: string,
): Promise<boolean> => {
  try {
    if (!email) return false;

    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .ilike('email', email) // case-insensitive
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error(error);
    return false;
  }
};
