
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
