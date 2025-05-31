
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';

/**
 * Fetch all students for a specific client
 */
export const fetchStudentsByClientId = async (clientId: string): Promise<Student[]> => {
  try {
    //console.log('Fetching students for client_id:', clientId);
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    // Transform database student data to match frontend Student type
    const transformedStudents: Student[] = (data || []).map(dbStudent => ({
      id: dbStudent.id,
      studentId: dbStudent.student_id,
      name: dbStudent.name,
      grade: dbStudent.grade,
      section: dbStudent.section,
      campus: dbStudent.campus,
      createdAt: new Date(dbStudent.created_at),
      updatedAt: new Date(dbStudent.updated_at)
    }));

    //console.log(`Successfully fetched ${transformedStudents.length} students`);
    return transformedStudents;
  } catch (error) {
    console.error('Error in fetchStudentsByClientId:', error);
    throw error;
  }
};
