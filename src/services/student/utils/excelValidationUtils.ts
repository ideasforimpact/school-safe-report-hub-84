
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

/**
 * Validate Excel data against database constraints
 * Checks for valid campuses, grades, and sections for the client
 */
export const validateExcelData = async (rawData: any[]): Promise<string[]> => {
  const { employeeData } = useAuth();
  
  if (!employeeData?.clientId) {
    throw new Error('Client ID is required for validation');
  }

  try {
    const { data, error } = await supabase.functions.invoke('student-management', {
      body: {
        students: rawData,
        client_id: employeeData.clientId
      },
      method: 'POST',
      headers: { 
        path: 'validate',
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      throw error;
    }

    return data.errors || [];
  } catch (error) {
    console.error('Error validating Excel data:', error);
    throw error;
  }
};
