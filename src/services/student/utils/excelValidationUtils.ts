
import { RawStudentData } from '../types/importTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates the data extracted from Excel/CSV
 * Performs both format and data validation
 */
export const validateExcelData = async (data: RawStudentData[], clientId: string | null = null): Promise<string[]> => {
  const errors: string[] = [];
  
  // Check if there is data to process
  if (!data || data.length === 0) {
    errors.push('No data found in the file.');
    return errors;
  }

  // Check if client ID is provided
  if (!clientId) {
    errors.push('Client ID is required for validation.');
    return errors;
  }
  
  try {
    // Call the validation edge function
    const { data: validationResult, error } = await supabase.functions.invoke('student-management', {
      method: 'POST',
      headers: { path: 'validate', clientId },
      body: { 
        students: data,
        client_id: clientId
      }
    });
    
    if (error) {
      console.error('Validation edge function error:', error);
      errors.push(`Server validation error: ${error.message}`);
      return errors;
    }
    
    if (validationResult && !validationResult.valid) {
      return validationResult.errors || ['Unknown validation error'];
    }
    
    return errors;
  } catch (error) {
    console.error('Error validating Excel data:', error);
    errors.push(`Validation error: ${(error as Error).message}`);
    return errors;
  }
};
