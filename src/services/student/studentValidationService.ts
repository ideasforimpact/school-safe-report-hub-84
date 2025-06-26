
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
